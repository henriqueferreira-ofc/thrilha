
import { Task } from '@/types/task';
import { useTaskAdd } from './operations/use-task-add';
import { useTaskUpdate } from './operations/use-task-update';
import { useTaskDelete } from './operations/use-task-delete';
import { useTaskStatus } from './operations/use-task-status';

export function useTaskOperations(tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const { addTask } = useTaskAdd(tasks, setTasks);
  const { updateTask } = useTaskUpdate(tasks, setTasks);
  const { deleteTask } = useTaskDelete(tasks, setTasks);
  const { changeTaskStatus } = useTaskStatus(tasks, setTasks);

  return {
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus
  };
}
