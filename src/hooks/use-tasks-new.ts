
import { useTaskCoreNew } from './tasks/use-task-core-new';
import { useTaskOperationsNew } from './tasks/use-task-operations-new';

export function useTasks() {
  const { tasks, setTasks, loading } = useTaskCoreNew();
  const { addTask, updateTask, deleteTask, changeTaskStatus, getStatusName } = useTaskOperationsNew(tasks, setTasks);

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
