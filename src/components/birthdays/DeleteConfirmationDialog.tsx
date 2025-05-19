
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

interface DeleteConfirmationDialogProps {
  itemName: string;
  itemLabel?: string;
  onDelete: () => Promise<void>;
  children?: ReactNode;
  trigger?: ReactNode;
}

export function DeleteConfirmationDialog({
  itemName,
  itemLabel = "item",
  onDelete,
  children,
  trigger
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {itemLabel}</AlertDialogTitle>
          <AlertDialogDescription>
            {children || (
              <>
                Tem certeza que deseja excluir o {itemLabel.toLowerCase()} de {itemName}? 
                Esta ação não pode ser desfeita.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onDelete}
            className="bg-red-500 hover:bg-red-600"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
