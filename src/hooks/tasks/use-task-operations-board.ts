import { Task, TaskFormData } from '@/types/task';
import { useAuth } from '@/context/AuthContext';
import { Board } from '@/types/board';
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
  currentBoard: Board | null,
  optimisticUpdate?: OptimisticUpdate
) {
  const { user } = useAuth();
  
  // Gerar logs para debug
  console.log('useTaskOperationsBoard - Inicializado com', 
    `tarefas: ${tasks?.length || 0}`, 
    `quadro atual: ${currentBoard?.id || 'nenhum'}`,
    `usuário: ${user?.id || 'não autenticado'}`
  );
  
  // Criar versões específicas dos hooks com otimização
  const taskCreate = useTaskCreate(tasks, setTasks, user, currentBoard);
  const taskUpdate = useTaskUpdate(tasks, setTasks, user);
  const taskDelete = useTaskDelete(tasks, setTasks, user);
  const taskStatus = useTaskStatus(tasks, setTasks, user, currentBoard);

  // Funções otimizadas que usam atualização otimista
  const addTask = async (taskData: TaskFormData) => {
    // Primeiro atualiza otimisticamente com uma tarefa temporária
    const tempTask: Task = {
      id: `temp-${Date.now()}`,
      title: taskData.title,
      description: taskData.description || '',
      status: 'todo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || '',
      board_id: currentBoard?.id || '',
      due_date: taskData.dueDate
    };

    if (optimisticUpdate) {
      optimisticUpdate.addTask(tempTask);
    }

    // Depois tenta criar no servidor
    const result = await taskCreate.addTask(taskData);
    
    if (result) {
      // Se sucesso, atualiza com os dados reais
      if (optimisticUpdate) {
        optimisticUpdate.updateTask(result);
      }
    } else {
      // Se falhou, remove a tarefa temporária
      if (optimisticUpdate) {
        optimisticUpdate.deleteTask(tempTask.id);
      }
    }
    
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
