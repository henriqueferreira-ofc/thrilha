
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface TaskActionsMenuProps {
  taskId: string;
  taskUserId?: string;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export function TaskActionsMenu({ taskId, taskUserId, onEdit, onDelete }: TaskActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/10">
          <MoreHorizontal size={16} />
          <span className="sr-only">Opções</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {taskUserId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(taskId)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
