
import { Task, TaskStatus } from "../types/task";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Chave usada para armazenar as tarefas no localStorage
const TASKS_STORAGE_KEY = 'vo-tasks';

// Generate a unique ID for tasks
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Get tasks from local storage
export const getStoredTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return storedTasks ? JSON.parse(storedTasks) : [];
  } catch (error) {
    console.error('Erro ao recuperar tarefas do localStorage:', error);
    return [];
  }
};

// Save tasks to local storage
export const saveTasks = (tasks: Task[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    console.log('Tarefas salvas no localStorage:', tasks);
  } catch (error) {
    console.error('Erro ao salvar tarefas no localStorage:', error);
  }
};

// Format date to display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "dd 'de' MMM", { locale: ptBR });
};

// Group tasks by status
export const groupTasksByStatus = (tasks: Task[]) => {
  const columns = {
    todo: {
      id: "todo" as TaskStatus,
      title: "A Fazer",
      tasks: [] as Task[]
    },
    "in-progress": {
      id: "in-progress" as TaskStatus,
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

  return [columns.todo, columns["in-progress"], columns.done];
};

// Verificar se uma tarefa está próxima do prazo (3 dias ou menos)
export const isTaskDueSoon = (task: Task): boolean => {
  if (!task.due_date) return false;
  const dueDate = new Date(task.due_date);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
};

// Verificar se uma tarefa está atrasada
export const isTaskOverdue = (task: Task): boolean => {
  if (!task.due_date) return false;
  const dueDate = new Date(task.due_date);
  const today = new Date();
  return dueDate < today && task.status !== 'done';
};
