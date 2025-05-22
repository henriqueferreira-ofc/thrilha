
import { useState } from 'react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  format
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { Task } from '@/types/task';

const weekDays = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function CalendarCustom({
  value,
  onChange,
  tasks = [],
  primaryColor = "bg-purple-600",
  holidays = []
}: {
  value?: Date;
  onChange?: (date: Date) => void;
  tasks?: Task[];
  primaryColor?: string;
  holidays?: {date: Date; name: string}[];
}) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const today = new Date();

  // Dias com pelo menos uma tarefa
  const taskDates = tasks
    .filter((t) => t.due_date)
    .map((t) => new Date(t.due_date!));

  // Dias com tarefas concluídas
  const doneDates = tasks
    .filter((t) => t.status === "done" && t.due_date)
    .map((t) => new Date(t.due_date!));

  // Dias com feriados
  const holidayDates = holidays.map(h => h.date);

  // Gera os dias do mês atual, incluindo os dias do início/fim da semana para alinhar corretamente
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const isCurrentMonth = isSameMonth(day, currentMonth);
      const isSelected = value && isSameDay(day, value);
      const isToday = isSameDay(day, today);
      const hasTask = taskDates.some((d) => isSameDay(d, day));
      const isDone = doneDates.some((d) => isSameDay(d, day));
      const isHoliday = holidayDates.some((d) => isSameDay(d, day));
      
      const holidayInfo = holidays.find(h => isSameDay(h.date, day));

      days.push(
        <button
          key={day.toString()}
          onClick={() => isCurrentMonth && onChange?.(new Date(day))}
          className={clsx(
            "w-10 h-10 flex items-center justify-center rounded-full transition relative",
            isCurrentMonth ? "text-white" : "text-zinc-600",
            isToday && `${primaryColor} border-2 border-white`,
            isSelected && "ring-2 ring-purple-400",
            isCurrentMonth && "hover:bg-zinc-800",
            !isCurrentMonth && "opacity-50 cursor-default"
          )}
          title={holidayInfo?.name}
          aria-label={format(day, "PPP", { locale: ptBR })}
          disabled={!isCurrentMonth}
        >
          {format(day, "d")}
          
          {/* Indicador de tarefas */}
          {hasTask && !isDone && (
            <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
          )}
          
          {/* Indicador de tarefas concluídas */}
          {isDone && (
            <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          )}
          
          {/* Indicador de feriado */}
          {isHoliday && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          )}
        </button>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg border border-white/10 p-4 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded hover:bg-zinc-800 text-zinc-300"
          aria-label="Mês anterior"
        >
          <ChevronLeft />
        </button>
        <span className="font-bold text-lg uppercase tracking-wide text-zinc-100">
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded hover:bg-zinc-800 text-zinc-300"
          aria-label="Próximo mês"
        >
          <ChevronRight />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-zinc-500 mb-2 text-sm">
        {weekDays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="flex flex-col gap-1">{rows}</div>
    </div>
  );
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
} 
