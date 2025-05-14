
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Task } from '@/types/task';

interface TaskActionsMenuProps {
  task: Task;
  onEdit?: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updatedData: Partial<Task>) => void;
}

export function TaskActionsMenu({ task, onEdit, onDelete, onUpdate }: TaskActionsMenuProps) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else if (onUpdate) {
      // Fallback para onUpdate se onEdit não for fornecido
      onUpdate(task.id, {});
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/10">
          <MoreHorizontal size={16} />
          <span className="sr-only">Opções</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete && onDelete(task.id)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
