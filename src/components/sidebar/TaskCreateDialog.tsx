
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { PlusCircle } from 'lucide-react';
import { TaskFormData } from '@/types/task';
import { useBoards } from '@/hooks/use-boards';

interface TaskCreateDialogProps {
  onCreateTask: (data: TaskFormData) => void;
}

export function TaskCreateDialog({ onCreateTask }: TaskCreateDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currentBoard } = useBoards();
  
  const handleCreateTask = (data: TaskFormData) => {
    // Use 'default' as boardId if there's no current board
    const taskData = {
      ...data,
      board_id: currentBoard?.id || 'default'
    };
    
    onCreateTask(taskData);
    setIsDialogOpen(false);
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
          boardId={currentBoard?.id || "default"} 
        />
      </DialogContent>
    </Dialog>
  );
}
