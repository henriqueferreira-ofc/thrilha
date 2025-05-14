
import { useDrag } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { Task } from '@/types/task';
import { TaskDueDate } from './task-due-date';
import { TaskActionsMenu } from './task-actions-menu';
import { TaskCollaboratorsButton } from './task-collaborators-button';
import { Check } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<Task>) => void;
  onToggleComplete?: () => void;
}

export function TaskCard({ task, onDelete, onUpdate, onToggleComplete }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    begin: () => {
      console.log(`TaskCard - Iniciando arrasto da tarefa ${task.id}`);
      return { id: task.id };
    },
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      console.log(`TaskCard - Finalizando arrasto da tarefa ${task.id}, sucesso: ${didDrop}`);
    }
  });

  // Estilo baseado no status da tarefa
  const getTaskStyle = () => {
    switch (task.status) {
      case 'todo':
        return 'border-l-4 border-l-purple-500/70';
      case 'in-progress':
        return 'border-l-4 border-l-blue-500/70';
      case 'done':
        return 'border-l-4 border-l-green-500/70';
      default:
        return '';
    }
  };

  return (
    <Card 
      ref={drag}
      className={`p-4 mb-2 bg-black ${getTaskStyle()} shadow-sm hover:shadow-md transition-all cursor-grab ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium">{task.title}</h3>
            {task.completed && (
              <span className="inline-flex items-center justify-center bg-green-500/20 p-1 rounded-full">
                <Check className="h-3.5 w-3.5 text-green-500" />
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        <TaskActionsMenu task={task} onDelete={onDelete} onUpdate={onUpdate} />
      </div>
      
      <div className="flex items-center justify-between mt-4">
        {task.due_date && (
          <TaskDueDate dueDate={task.due_date} status={task.status} />
        )}
        
        <div className="flex items-center space-x-2">
          <TaskCollaboratorsButton taskId={task.id} onClick={onToggleComplete} />
        </div>
      </div>
    </Card>
  );
}
