
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2Icon, Trash2Icon } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { Birthday } from './types';
import { formatBirthdayDate, getDaysRemainingInfo, getRelationshipInfo } from './utils';

interface BirthdayTableItemProps {
  birthday: Birthday;
  daysUntil: number;
  onEdit: (birthday: Birthday) => void;
  onDelete: (id: string) => void;
}

export function BirthdayTableItem({ birthday, daysUntil, onEdit, onDelete }: BirthdayTableItemProps) {

  // Handle delete confirmation
  const formattedBirthdate = formatBirthdayDate(birthday.birthdate);
  const relationshipInfo = getRelationshipInfo(birthday.relationship);
  const daysInfo = getDaysRemainingInfo(daysUntil);

  return (
    <TableRow key={birthday.id} className="hover:bg-purple-900/20 border-white/5">
      <TableCell className="font-medium whitespace-normal break-words max-w-[220px]">{birthday.name}</TableCell>
      <TableCell className="whitespace-normal break-words max-w-[180px]">{formattedBirthdate}</TableCell>
      <TableCell className="whitespace-normal break-words max-w-[160px]">
        <span className={relationshipInfo.className}>{relationshipInfo.label}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className={daysInfo.className}>{daysInfo.label}</span>
      </TableCell>
      <TableCell className="text-zinc-400 whitespace-normal break-words max-w-[220px]">{birthday.notes || '-'}</TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <div className="flex justify-end gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onEdit(birthday)}
            className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-900/40"
          >
            <Edit2Icon className="h-4 w-4" />
          </Button>
          <DeleteConfirmationDialog
            itemName={birthday.name}
            itemLabel="aniversário"
            onDelete={() => onDelete(birthday.id)}
            trigger={
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/40"
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
