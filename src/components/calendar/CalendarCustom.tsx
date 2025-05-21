import { useEffect, useState } from 'react';
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

const weekDays = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function CalendarCustom({ value, onChange }: { value?: Date; onChange?: (date: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const today = new Date();

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

      days.push(
        <button
          key={day.toString()}
          onClick={() => isCurrentMonth && onChange?.(day)}
          className={clsx(
            "w-10 h-10 flex items-center justify-center rounded-full transition",
            isCurrentMonth ? "text-white" : "text-zinc-600",
            isToday && "border border-zinc-400",
            isSelected && "bg-blue-700 text-white font-bold",
            isCurrentMonth && "hover:bg-zinc-800",
            !isCurrentMonth && "opacity-50 cursor-default"
          )}
          aria-label={format(day, "PPP", { locale: ptBR })}
          disabled={!isCurrentMonth}
        >
          {format(day, "d")}
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
    <div className="bg-[#181926] rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto">
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