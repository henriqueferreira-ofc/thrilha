import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { PlusCircle } from 'lucide-react';
import { TaskFormData } from '@/types/task';
import { useBoards } from '@/hooks/use-boards';
import { toast } from 'sonner';

interface TaskCreateDialogProps {
  onCreateTask: (data: TaskFormData) => void;
}

export function TaskCreateDialog({ onCreateTask }: TaskCreateDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currentBoard, getOrCreateDefaultBoard } = useBoards();
  
  const handleCreateTask = async (data: TaskFormData) => {
    try {
      // Obter o quadro atual ou criar um padrão se necessário
      const board = currentBoard || await getOrCreateDefaultBoard();
      
      if (!board) {
        toast.error('Não foi possível criar a tarefa. Tente novamente.');
        return;
      }

      // Criar a tarefa com o quadro obtido
      const taskData = {
        ...data,
        board_id: board.id
      };
      
      onCreateTask(taskData);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa. Tente novamente.');
    }
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 mt-4" 
          size="sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby="create-task-description">
        <DialogTitle>Criar Nova Tarefa</DialogTitle>
        <DialogDescription id="create-task-description">
          Preencha os dados abaixo para criar uma nova tarefa.
        </DialogDescription>
        <TaskForm 
          onSubmit={handleCreateTask} 
          boardId={currentBoard?.id} 
        />
      </DialogContent>
    </Dialog>
  );
}
