import { Task, TaskFormData } from '@/types/task';
import { useAuth } from '@/context/AuthContext';
import { Board } from '@/types/board';
import { useTaskCreate } from './operations/use-task-create';
import { useTaskUpdate } from './operations/use-task-update';
import { useTaskDelete } from './operations/use-task-delete';
import { useTaskStatus } from './operations/use-task-status';

export function useTaskOperationsBoard(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  currentBoard: Board | null
) {
  const { user } = useAuth();
  
  // Gerar logs para debug
  console.log('useTaskOperationsBoard - Inicializado com', 
    `tarefas: ${tasks?.length || 0}`, 
    `quadro atual: ${currentBoard?.id || 'nenhum'}`,
    `usuário: ${user?.id || 'não autenticado'}`
  );
  
  const { addTask } = useTaskCreate(tasks, setTasks, user, currentBoard);
  const { updateTask } = useTaskUpdate(tasks, setTasks, user);
  const { deleteTask } = useTaskDelete(tasks, setTasks, user);
  const { changeTaskStatus } = useTaskStatus(tasks, setTasks, user, currentBoard);

  return {
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus
  };
}
