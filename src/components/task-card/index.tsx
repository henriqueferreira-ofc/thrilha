
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Task } from '@/types/task';
import { TaskForm } from '@/components/task-form';
import { useDrag } from 'react-dnd';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskCollaboratorsDialog } from '../task-collaborators-dialog';
import { useAuth } from '@/context/AuthContext';
import { TaskDueDate } from './task-due-date';
import { TaskActionsMenu } from './task-actions-menu';
import { TaskCollaboratorsButton } from './task-collaborators-button';
import { getTaskBackgroundStyle } from './task-card-utils';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<Task>) => void;
  onToggleComplete: (taskId: string) => void;
}

export function TaskCard({ task, onDelete, onUpdate, onToggleComplete }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCollaboratorsDialogOpen, setIsCollaboratorsDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const completed = task.completed || task.status === 'done';

  // Configuração do drag and drop
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleUpdate = (updatedData: Partial<Task>) => {
    onUpdate(task.id, updatedData);
    setIsEditing(false);
  };

  return (
    <>
      <Card 
        ref={drag}
        className={cn(
          "mb-3 p-4 cursor-grab animate-fade-in transition-all duration-300",
          getTaskBackgroundStyle(task.status),
          isHovered ? 'scale-105 shadow-lg' : '',
          isDragging ? 'opacity-50' : ''
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-medium truncate mr-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={completed}
                onCheckedChange={() => onToggleComplete(task.id)}
              />
              <span className={completed ? 'line-through' : ''}>
                {task.title}
              </span>
            </div>
          </h3>
          <div className="flex items-center gap-2">
            <TaskCollaboratorsButton 
              onClick={() => setIsCollaboratorsDialogOpen(true)}
            />
            <TaskActionsMenu
              taskId={task.id}
              taskUserId={task.user_id}
              onEdit={handleEdit}
              onDelete={onDelete}
            />
          </div>
        </div>

        {task.description && (
          <p className="text-sm mt-2 text-muted-foreground line-clamp-3">{task.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <TaskDueDate dueDate={task.due_date} status={task.status} />
        </div>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="glass-panel sm:max-w-[425px]">
          <DialogTitle>Editar Tarefa</DialogTitle>
          <TaskForm
            initialData={{
              title: task.title,
              description: task.description,
              dueDate: task.due_date
            }}
            onSubmit={handleUpdate}
          />
        </DialogContent>
      </Dialog>

      {isCollaboratorsDialogOpen && (
        <TaskCollaboratorsDialog
          taskId={task.id}
          isOpen={isCollaboratorsDialogOpen}
          onClose={() => setIsCollaboratorsDialogOpen(false)}
        />
      )}
    </>
  );
}
