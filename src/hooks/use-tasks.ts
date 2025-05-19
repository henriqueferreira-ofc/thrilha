
import { useTaskCore } from './tasks/use-task-core';
import { useTaskOperations } from './tasks/use-task-operations';

export function useTasks() {
  const { tasks, setTasks, loading } = useTaskCore();
  const { addTask, updateTask, deleteTask, changeTaskStatus, getStatusName } = useTaskOperations(tasks, setTasks);

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
