
import { Calendar, CalendarClock } from 'lucide-react';
import { formatTaskDueDate, isDueSoon, isOverdue } from './task-card-utils';

interface TaskDueDateProps {
  dueDate?: string;
  status: string;
}

export function TaskDueDate({ dueDate, status }: TaskDueDateProps) {
  if (!dueDate) return null;
  
  const isTaskOverdue = isOverdue(dueDate, status);
  const isTaskDueSoon = isDueSoon(dueDate);
  
  return (
    <div className={`flex items-center text-xs ${isTaskOverdue ? 'text-red-400' : isTaskDueSoon ? 'text-amber-400' : 'text-muted-foreground'}`}>
      {isTaskOverdue ? (
        <CalendarClock size={14} className="mr-1 animate-pulse" />
      ) : (
        <Calendar size={14} className="mr-1" />
      )}
      {formatTaskDueDate(dueDate)}
    </div>
  );
}
