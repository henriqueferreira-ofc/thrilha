
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

interface CalendarHeaderProps {
  selectedDate: Date | undefined;
}

export const CalendarHeader = ({ selectedDate }: CalendarHeaderProps) => {
  // Função para formatar a data selecionada
  const formattedDate = selectedDate
    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Selecione uma data';

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-blue-500" />
        {formattedDate}
      </h2>
    </div>
  );
};
