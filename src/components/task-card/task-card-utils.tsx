
import { Task } from "@/types/task";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Determinando a cor de fundo com base no status da tarefa
export const getTaskBackgroundStyle = (status: string): string => {
  switch (status) {
    case 'todo':
      return 'bg-purple-500/20 hover:bg-purple-500/30 border-l-4 border-purple-500';
    case 'in-progress': 
      return 'bg-blue-500/20 hover:bg-blue-500/30 border-l-4 border-blue-500';
    case 'done':
      return 'bg-green-500/20 hover:bg-green-500/30 border-l-4 border-green-500';
    default:
      return 'bg-purple-500/20 hover:bg-purple-500/30';
  }
};

// Verifica se a data de vencimento está próxima (menos de 3 dias)
export const isDueSoon = (due_date?: string): boolean => {
  if (!due_date) return false;
  const dueDate = new Date(due_date);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
};

// Verifica se a tarefa está atrasada
export const isOverdue = (due_date?: string, status?: string): boolean => {
  if (!due_date) return false;
  const dueDate = new Date(due_date);
  const today = new Date();
  return dueDate < today && status !== 'done';
};

// Formata a data de vencimento 
export const formatTaskDueDate = (due_date?: string): string | null => {
  if (!due_date) return null;
  const dueDate = new Date(due_date);
  return format(dueDate, "dd 'de' MMM", { locale: ptBR });
};
