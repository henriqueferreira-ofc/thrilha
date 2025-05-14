
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Task } from '@/types/task';
import { TaskActionsMenu } from './task-actions-menu';
import { TaskDueDate } from './task-due-date';
import { TaskCollaboratorsButton } from './task-collaborators-button';
import { useDrag } from 'react-dnd';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updatedData: Partial<Task>) => void;
  onToggleComplete?: () => void;
}

export function TaskCard({ task, onDelete, onUpdate, onToggleComplete }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'task', // Tipo precisa ser minúsculo para corresponder ao que é esperado em TaskColumn
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <Card 
      ref={drag}
      className={cn(
        "mb-3 shadow-sm border border-border bg-card hover:shadow-md transition-all cursor-grab",
        isDragging ? "opacity-50" : "opacity-100"
      )}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between">
        <h3 className="text-sm font-medium break-words pr-4">{task.title}</h3>
        <TaskActionsMenu 
          task={task} 
          onDelete={onDelete} 
          onUpdate={onUpdate} 
        />
      </CardHeader>
      
      <CardContent className="p-3 pt-2">
        {task.description && (
          <p className="text-xs text-muted-foreground break-words">
            {task.description.length > 100 
              ? `${task.description.substring(0, 100)}...` 
              : task.description}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-0 flex items-center justify-between">
        <TaskDueDate dueDate={task.due_date} status={task.status} />
        <TaskCollaboratorsButton taskId={task.id} onClick={onToggleComplete} />
      </CardFooter>
    </Card>
  );
}
