import { Task, TaskFormData } from '@/types/task';
import { useAuth } from '@/context/AuthContext';
import { useTaskOperations } from './use-task-operations';

interface OptimisticUpdate {
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
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
  
  // Usar apenas o useTaskOperations
  const { addTask, updateTask, deleteTask, changeTaskStatus } = useTaskOperations(tasks, setTasks);

  return {
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus
  };
}
