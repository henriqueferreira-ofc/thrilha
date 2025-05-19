
import { useTaskCore } from './tasks/use-task-core';
import { useTaskOperations } from './tasks/use-task-operations';
import { getStatusName } from '@/lib/task-utils';

export function useTasks() {
  const { tasks, setTasks, loading } = useTaskCore();
  const { addTask, updateTask, deleteTask, changeTaskStatus } = useTaskOperations(tasks, setTasks);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    getStatusName
  };
}
