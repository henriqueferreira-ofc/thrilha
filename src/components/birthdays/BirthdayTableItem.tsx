
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { Birthday } from './types';

interface BirthdayTableItemProps {
  birthday: Birthday;
  daysUntil: number;
  onEdit: (birthday: Birthday) => void;
  onDelete: (id: string) => Promise<void>;
}

export function BirthdayTableItem({ 
  birthday, 
  daysUntil, 
  onEdit, 
  onDelete 
}: BirthdayTableItemProps) {
  const formatBirthdate = (dateString: string) => {
    try {
      // Tenta fazer o parse da data (podendo estar em formato ISO ou apenas data)
      const date = dateString.includes('T') 
        ? parseISO(dateString) 
        : new Date(dateString);
      
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <TableRow key={birthday.id}>
      <TableCell className="font-medium">{birthday.name}</TableCell>
      <TableCell>{formatBirthdate(birthday.birthdate)}</TableCell>
      <TableCell>{birthday.relationship}</TableCell>
      <TableCell>
        <span className={daysUntil <= 7 ? "text-red-400 font-bold" : ""}>
          {daysUntil} dias
        </span>
      </TableCell>
      <TableCell>{birthday.notes || "-"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onEdit(birthday)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <DeleteConfirmationDialog
            itemName={birthday.name}
            itemLabel="Aniversário"
            onDelete={() => onDelete(birthday.id)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
