
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, FlagIcon } from 'lucide-react';

interface CalendarHeaderProps {
  selectedDate: Date | undefined;
  holidayName?: string;
}

export const CalendarHeader = ({ selectedDate, holidayName }: CalendarHeaderProps) => {
  // Função para formatar a data selecionada
  const formattedDate = selectedDate
    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Selecione uma data';

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-purple-500" />
        {formattedDate}
      </h2>
      
      {holidayName && (
        <div className="flex items-center gap-2 mt-2 text-purple-400">
          <FlagIcon className="h-4 w-4" />
          <span>{holidayName}</span>
        </div>
      )}
    </div>
  );
};
