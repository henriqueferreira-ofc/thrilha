
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarNavigationProps {
  currentMonth: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const CalendarNavigation = ({ 
  currentMonth, 
  onNavigate 
}: CalendarNavigationProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <button 
        onClick={() => onNavigate('prev')}
        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-5 w-5 text-purple-400" />
      </button>
      <h2 className="text-xl font-bold uppercase tracking-wider purple-gradient-text">
        {format(currentMonth, "MMMM 'DE' yyyy", { locale: ptBR })}
      </h2>
      <button 
        onClick={() => onNavigate('next')}
        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-5 w-5 text-purple-400" />
      </button>
    </div>
  );
};
