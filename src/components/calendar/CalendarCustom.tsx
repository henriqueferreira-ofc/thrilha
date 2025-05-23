
import { useState, useEffect } from 'react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  format,
  isEqual
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { Task } from '@/types/task';

function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const today = new Date();

  // Sincronizar mês exibido com a data selecionada
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    }
  }, [value]);

  // Selecionar data pendente após mudar o mês
  useEffect(() => {
    if (pendingDate) {
      onChange?.(pendingDate);
      setPendingDate(null);
    }
  }, [currentMonth, onChange, pendingDate]);

  // Função para verificar se uma tarefa está em uma data específica
  const isTaskOnDate = (task: Task, date: Date): boolean => {
    if (!task.due_date) return false;
    
    const taskDate = new Date(task.due_date);
    return taskDate.getFullYear() === date.getFullYear() &&
           taskDate.getMonth() === date.getMonth() &&
           taskDate.getDate() === date.getDate();
  };

  // Função para filtrar feriados por mês corrente
  const currentMonthHolidays = holidays.filter(holiday => 
    holiday.date.getMonth() === currentMonth.getMonth() && 
    holiday.date.getFullYear() === currentMonth.getFullYear()
  );

  // Dias com tarefas - sem os pontos duplicados
  const taskDatesNormalized = tasks
    .filter(t => t.due_date)
    .map(t => {
      const date = new Date(t.due_date!);
      // Normalizar para meia-noite para evitar problemas de horário
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    });
  
  // Remover duplicados usando Set
  const taskDatesSet = new Set(
    taskDatesNormalized.map(date => 
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    )
  );
  
  const taskDates = Array.from(taskDatesSet).map(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month, day);
  });

  // Dias com tarefas concluídas - sem duplicados
  const doneDatesSet = new Set(
    tasks
      .filter(t => t.status === "done" && t.due_date)
      .map(t => {
        const date = new Date(t.due_date!);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
  );
  
  const doneDates = Array.from(doneDatesSet).map(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month, day);
  });

  // Dias com tarefas pendentes - sem duplicados
  const pendingDatesSet = new Set(
    tasks
      .filter(t => t.status !== "done" && t.due_date)
      .map(t => {
        const date = new Date(t.due_date!);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
  );
  
  const pendingDates = Array.from(pendingDatesSet).map(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month, day);
  });

  // Dias com feriados - sem duplicados
  const holidayDatesSet = new Set(
    holidays.map(h => {
      const date = h.date;
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );
  
  const holidayDates = Array.from(holidayDatesSet).map(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month, day);
  });

  // Gera os dias do mês atual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(day);
      const isCurrentMonth = isSameMonth(currentDay, currentMonth);
      const isSelected = value && isSameDay(currentDay, value);
      const isToday = isSameDay(currentDay, today);
      
      const tasksForDay = tasks.filter(task => isTaskOnDate(task, currentDay));
      const hasPendingTask = pendingDates.some(d => isSameDay(d, currentDay));
      const hasDoneTask = doneDates.some(d => isSameDay(d, currentDay));
      const isHoliday = holidayDates.some(d => isSameDay(d, currentDay));
      
      const holidayInfo = holidays.find(h => isSameDay(h.date, currentDay));

      days.push(
        <button
          key={currentDay.toString()}
          onClick={() => {
            const clickedDate = new Date(currentDay);
            if (!isSameMonth(currentDay, currentMonth)) {
              setCurrentMonth(new Date(currentDay.getFullYear(), currentDay.getMonth(), 1));
              setPendingDate(clickedDate);
            } else {
              onChange?.(clickedDate);
            }
          }}
          className={clsx(
            "w-10 h-10 flex items-center justify-center rounded-full transition relative",
            isCurrentMonth ? "text-white" : "text-zinc-600",
            isToday && `${primaryColor} border-2 border-white`,
            isSelected && "ring-2 ring-purple-400",
            isCurrentMonth && "hover:bg-zinc-800",
            !isCurrentMonth && "opacity-50 cursor-default"
          )}
          title={tasksForDay.length > 0 ? 
            `${tasksForDay.length} tarefa(s) para ${format(currentDay, "dd/MM", { locale: ptBR })}` : 
            holidayInfo?.name || format(currentDay, "PPP", { locale: ptBR })
          }
          aria-label={format(currentDay, "PPP", { locale: ptBR })}
        >
          {format(currentDay, "d")}
          
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
    <div className="bg-black rounded-lg shadow-lg border border-white/5 p-4 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded hover:bg-zinc-800 text-purple-300"
          aria-label="Mês anterior"
        >
          <ChevronLeft />
        </button>
        <span className="font-bold text-lg tracking-wide purple-gradient-text">
          {capitalizeFirst(format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR }))}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded hover:bg-zinc-800 text-purple-300"
          aria-label="Próximo mês"
        >
          <ChevronRight />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-purple-500 mb-2 text-sm">
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
