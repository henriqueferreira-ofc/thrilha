
import { useState } from 'react';
import { Calendar, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Task } from '@/types/task';
import { formatDate } from '@/lib/task-utils';
import { TaskForm } from '@/components/task-form';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<Task>) => void;
}

export function TaskCard({ task, onDelete, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleUpdate = (updatedData: Partial<Task>) => {
    onUpdate(task.id, updatedData);
    setIsEditing(false);
  };

  return (
    <>
      <Card className="glass-card mb-3 p-4 cursor-grab animate-fade-in" draggable>
        <div className="flex justify-between items-start">
          <h3 className="font-medium truncate mr-2">{task.title}</h3>
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
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-sm mt-2 text-muted-foreground line-clamp-3">{task.description}</p>
        )}

        {task.dueDate && (
          <div className="mt-3 flex items-center text-xs text-muted-foreground">
            <Calendar size={14} className="mr-1" />
            {formatDate(task.dueDate)}
          </div>
        )}
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="glass-panel sm:max-w-[425px]">
          <DialogTitle>Editar Tarefa</DialogTitle>
          <TaskForm
            initialData={{
              title: task.title,
              description: task.description,
              dueDate: task.dueDate
            }}
            onSubmit={handleUpdate}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
