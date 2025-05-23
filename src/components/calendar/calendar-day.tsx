
import { isSameDay, isSameMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import clsx from "clsx";
import { Task } from "@/types/task";
import { dateHasStatus } from "./calendar-utils";

interface CalendarDayProps {
  day: Date;
  currentMonth: Date;
  selectedDate?: Date;
  isToday: boolean;
  onDateClick: (date: Date) => void;
  primaryColor: string;
  pendingDates: Date[];
  doneDates: Date[];
  holidayDates: Date[];
  tasks: Task[];
  holidays: {date: Date, name: string}[];
}

export function CalendarDay({
  day,
  currentMonth,
  selectedDate,
  isToday,
  onDateClick,
  primaryColor,
  pendingDates,
  doneDates,
  holidayDates,
  tasks,
  holidays
}: CalendarDayProps) {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isSelected = selectedDate && isSameDay(day, selectedDate);
  
  // Check if the day has tasks or holidays
  const hasPendingTask = dateHasStatus(day, pendingDates);
  const hasDoneTask = dateHasStatus(day, doneDates);
  const isHoliday = dateHasStatus(day, holidayDates);
  
  // Get tasks for the day (for tooltip)
  const tasksForDay = tasks.filter(task => {
    if (!task.due_date) return false;
    
    const taskDate = new Date(task.due_date);
    return isSameDay(taskDate, day);
  });
  
  // Get holiday info for tooltip
  const holidayInfo = holidays.find(h => isSameDay(h.date, day));
  
  return (
    <button
      onClick={() => onDateClick(new Date(day))}
      className={clsx(
        "w-10 h-10 flex items-center justify-center rounded-full transition relative",
        isCurrentMonth ? "text-white" : "text-zinc-600",
        isToday && `${primaryColor} border-2 border-white`,
        isSelected && "ring-2 ring-purple-400",
        isCurrentMonth && "hover:bg-zinc-800",
        !isCurrentMonth && "opacity-50 cursor-default"
      )}
      title={tasksForDay.length > 0 ? 
        `${tasksForDay.length} tarefa(s) para ${format(day, "dd/MM", { locale: ptBR })}` : 
        holidayInfo?.name || format(day, "PPP", { locale: ptBR })
      }
      aria-label={format(day, "PPP", { locale: ptBR })}
    >
      {format(day, "d")}
      
      {/* Indicador de tarefas pendentes */}
      {hasPendingTask && (
        <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite]"></span>
      )}
      
      {/* Indicador de tarefas concluídas */}
      {hasDoneTask && !hasPendingTask && (
        <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"></span>
      )}
      
      {/* Indicador de feriado */}
      {isHoliday && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
      )}
    </button>
  );
}
