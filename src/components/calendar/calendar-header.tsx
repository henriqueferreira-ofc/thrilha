
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { capitalizeFirst, weekDays } from "./calendar-utils";

interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  primaryColor?: string;
}

export function CalendarHeader({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  primaryColor
}: CalendarHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded hover:bg-zinc-800 text-purple-300"
          aria-label="Mês anterior"
        >
          <ChevronLeft />
        </button>
        <span className="font-bold text-lg tracking-wide purple-gradient-text">
          {capitalizeFirst(format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR }))}
        </span>
        <button
          onClick={onNextMonth}
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
    </>
  );
}
