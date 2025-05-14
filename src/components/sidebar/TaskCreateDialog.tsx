
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { PlusCircle } from 'lucide-react';
import { TaskFormData } from '@/types/task';
import { Board } from '@/types/board';
import { useTaskCounter } from '@/hooks/tasks/use-task-counter';

interface TaskCreateDialogProps {
  onCreateTask: (data: TaskFormData) => void;
  currentBoard: Board | null;
}

export function TaskCreateDialog({ onCreateTask, currentBoard }: TaskCreateDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { limitReached } = useTaskCounter(currentBoard);
  
  const handleCreateTask = (data: TaskFormData) => {
    onCreateTask({
      ...data,
      board_id: currentBoard?.id
    });
    setIsDialogOpen(false);
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 mt-4" 
          size="sm"
          disabled={!currentBoard || limitReached}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby="create-task-description">
        <DialogTitle>Criar Nova Tarefa</DialogTitle>
        <p id="create-task-description" className="sr-only">
          Formulário para criar uma nova tarefa
        </p>
        <TaskForm onSubmit={handleCreateTask} boardId={currentBoard?.id} />
      </DialogContent>
    </Dialog>
  );
}
