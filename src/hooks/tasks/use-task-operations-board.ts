
import { Task, TaskFormData } from '@/types/task';
import { useAuth } from '@/context/AuthContext';
import { useTaskCreate } from './operations/use-task-create';
import { useTaskUpdate } from './operations/use-task-update';
import { useTaskDelete } from './operations/use-task-delete';
import { useTaskStatus } from './operations/use-task-status';

interface OptimisticUpdate {
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
}

export function useTaskOperationsBoard(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  optimisticUpdate?: OptimisticUpdate
) {
  const { user } = useAuth();
  
  // Gerar logs para debug
  console.log('useTaskOperationsBoard - Inicializado com', 
    `tarefas: ${tasks?.length || 0}`, 
    `usuário: ${user?.id || 'não autenticado'}`
  );
  
  // Criar versões específicas dos hooks com otimização
  const taskCreate = useTaskCreate(tasks, setTasks, user);
  const taskUpdate = useTaskUpdate(tasks, setTasks, user);
  const taskDelete = useTaskDelete(tasks, setTasks, user);
  const taskStatus = useTaskStatus(tasks, setTasks, user);

  // Funções otimizadas que usam atualização otimista
  const addTask = async (taskData: TaskFormData) => {
    // Criar no servidor diretamente, sem atualização otimista duplicada
    const result = await taskCreate.addTask(taskData);
    return result;
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    // Primeiro atualiza otimisticamente
    const currentTask = tasks.find(t => t.id === id);
    if (currentTask && optimisticUpdate) {
      const optimisticTask = { ...currentTask, ...data };
      optimisticUpdate.updateTask(optimisticTask);
    }

    // Depois tenta atualizar no servidor
    await taskUpdate.updateTask(id, data);
  };

  const deleteTask = async (id: string) => {
    // Primeiro remove otimisticamente
    if (optimisticUpdate) {
      optimisticUpdate.deleteTask(id);
    }

    // Depois tenta remover no servidor
    await taskDelete.deleteTask(id);
  };

  return {
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus: taskStatus.changeTaskStatus
  };
}
