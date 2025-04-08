
import { useTaskCore } from './tasks/use-task-core';
import { useTaskOperations } from './tasks/use-task-operations';
import { useTaskCollaborators } from './tasks/use-task-collaborators';

export function useTasks() {
  const { tasks, loading, setTasks } = useTaskCore();
  const { addTask, updateTask, deleteTask, changeTaskStatus } = useTaskOperations(tasks, setTasks);
  const { addCollaborator, removeCollaborator, getTaskCollaborators, isTaskOwner } = useTaskCollaborators();
  
  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    addCollaborator,
    removeCollaborator,
    getTaskCollaborators,
    isTaskOwner
  };
}
