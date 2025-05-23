
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2Icon, Trash2Icon } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { Birthday } from './types';

interface BirthdayTableItemProps {
  birthday: Birthday;
  daysUntil: number;
  onEdit: (birthday: Birthday) => void;
  onDelete: (id: string) => void;
}

export function BirthdayTableItem({ birthday, daysUntil, onEdit, onDelete }: BirthdayTableItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Função para formatar a data do aniversário
  const formatBirthdate = (dateStr: string): string => {
    try {
      // Parse the date without timezone conversion
      const dateOnly = dateStr.split('T')[0];
      const formattedDate = format(new Date(dateOnly), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      return formattedDate;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateStr;
    }
  };

  // Função para exibir os dias restantes
  const getDaysRemaining = () => {
    if (daysUntil === 0) {
      return <span className="text-green-500 font-bold">Hoje!</span>;
    } else if (daysUntil === 1) {
      return <span className="text-yellow-500">Amanhã</span>;
    } else if (daysUntil <= 7) {
      return <span className="text-yellow-500">{daysUntil} dias</span>;
    } else {
      return <span>{daysUntil} dias</span>;
    }
  };

  // Função para exibir a relação da pessoa
  const getRelationshipLabel = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case 'familiar':
      case 'família': 
        return <span className="text-purple-400">Familiar</span>;
      case 'amigo':
      case 'amiga':
      case 'amigos':
        return <span className="text-blue-400">Amigo(a)</span>;
      case 'colega':
      case 'colegas':
      case 'trabalho':
        return <span className="text-cyan-400">Colega</span>;
      default:
        return <span>{relationship}</span>;
    }
  };

  return (
    <TableRow key={birthday.id} className="hover:bg-purple-900/20 border-white/5">
      <TableCell className="font-medium">{birthday.name}</TableCell>
      <TableCell>{formatBirthdate(birthday.birthdate)}</TableCell>
      <TableCell>{getRelationshipLabel(birthday.relationship)}</TableCell>
      <TableCell>{getDaysRemaining()}</TableCell>
      <TableCell className="text-zinc-400">{birthday.notes || '-'}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onEdit(birthday)}
            className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-900/40"
          >
            <Edit2Icon className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/40"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
        <DeleteConfirmationDialog 
          isOpen={showDeleteDialog} 
          onClose={() => setShowDeleteDialog(false)} 
          onConfirm={() => {
            onDelete(birthday.id);
            setShowDeleteDialog(false);
          }} 
          name={birthday.name}
        />
      </TableCell>
    </TableRow>
  );
}
