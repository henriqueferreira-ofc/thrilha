
import { Task, TaskStatus } from "../types/task";

// Generate a unique ID for tasks
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Get tasks from local storage
export const getStoredTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  
  const storedTasks = localStorage.getItem('vo-tasks');
  return storedTasks ? JSON.parse(storedTasks) : [];
};

// Save tasks to local storage
export const saveTasks = (tasks: Task[]): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('vo-tasks', JSON.stringify(tasks));
};

// Format date to display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short'
  });
};

// Group tasks by status
export const groupTasksByStatus = (tasks: Task[]) => {
  const columns = {
    todo: {
      id: "todo" as TaskStatus,
      title: "A Fazer",
      tasks: [] as Task[]
    },
    inProgress: {
      id: "inProgress" as TaskStatus,
      title: "Em Progresso",
      tasks: [] as Task[]
    },
    done: {
      id: "done" as TaskStatus,
      title: "Concluídas",
      tasks: [] as Task[]
    }
  };

  tasks.forEach((task) => {
    columns[task.status].tasks.push(task);
  });

  return [columns.todo, columns.inProgress, columns.done];
};
