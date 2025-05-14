
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { Board } from '@/types/board';
import { useAuth } from '@/context/AuthContext';
import { 
  useTaskCreate, 
  useTaskUpdate, 
  useTaskDelete, 
  useTaskStatus 
} from './operations';

export function useTaskOperationsBoard(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  currentBoard: Board | null
) {
  const { user } = useAuth();
  
  // Operações de tarefa
  const { addTask } = useTaskCreate(tasks, setTasks, user, currentBoard);
  const { updateTask } = useTaskUpdate(tasks, setTasks, user);
  const { deleteTask } = useTaskDelete(tasks, setTasks, user);
  const { changeTaskStatus } = useTaskStatus(tasks, setTasks, user);
  
  return {
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus
  };
}
