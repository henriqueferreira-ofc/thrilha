
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Verificar se uma tarefa está próxima do prazo (3 dias ou menos)
export const isDueSoon = (dueDate?: string): boolean => {
  if (!dueDate) return false;
  const dueDateObj = new Date(dueDate);
  const today = new Date();
  const diffTime = dueDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
};

// Verificar se uma tarefa está atrasada
export const isOverdue = (dueDate?: string, status?: string): boolean => {
  if (!dueDate) return false;
  const dueDateObj = new Date(dueDate);
  const today = new Date();
  return dueDateObj < today && status !== 'done';
};

// Formata a data de vencimento 
export const formatTaskDueDate = (dueDate?: string): string => {
  if (!dueDate) return '';
  const dueDateObj = new Date(dueDate);
  return format(dueDateObj, "dd 'de' MMM", { locale: ptBR });
};
