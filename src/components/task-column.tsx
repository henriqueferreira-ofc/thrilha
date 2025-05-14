
import { useDrop } from 'react-dnd';
import { Task, TaskStatus, Column } from '@/types/task';
import { TaskCard } from '@/components/task-card';
import { useTaskCounter } from '@/hooks/tasks/use-task-counter';
import { useSubscription } from '@/hooks/use-subscription';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface TaskColumnProps {
  column: Column;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<Task>) => void;
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
}

export function TaskColumn({ column, onDelete, onUpdate, onDrop }: TaskColumnProps) {
  const { limitReached } = useTaskCounter();
  const { isPro } = useSubscription();
  
  // Set up drop functionality with more detailed logging
  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item: { id: string }) => {
      console.log(`TaskColumn - Tarefa ${item.id} sendo solta na coluna ${column.id}`);
      onDrop(item.id, column.id);
    },
    hover: (item: { id: string }) => {
      console.log(`TaskColumn - Tarefa ${item.id} passando sobre a coluna ${column.id}`);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Estilo específico para cada tipo de coluna
  const getColumnStyle = () => {
    switch (column.id) {
      case 'todo':
        return 'border-t-4 border-t-purple-500/70 bg-black';
      case 'in-progress':
        return 'border-t-4 border-t-blue-500/70 bg-black';
      case 'done':
        return 'border-t-4 border-t-green-500/70 bg-black';
      default:
        return 'bg-black';
    }
  };

  // Handler for toggling task completion
  const handleToggleComplete = (task: Task) => {
    console.log(`TaskColumn - Alternando status da tarefa ${task.id} de ${task.status} para ${task.status === 'done' ? 'todo' : 'done'}`);
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    onDrop(task.id, newStatus);
  };

  // Verificar se deve exibir o aviso na coluna de "Concluídas"
  const showLimitWarning = column.id === 'done' && limitReached && !isPro;

  return (
    <div 
      ref={drop}
      className={`flex flex-col h-full p-4 rounded-lg border border-white/10 ${getColumnStyle()} ${
        isOver ? 'scale-105 shadow-lg transition-transform' : 'transition-transform'
      }`}
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {column.title}
          {column.id === 'done' && !isPro && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-help ml-1" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>No plano gratuito, você pode ter até 3 tarefas concluídas.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="bg-white/10 text-xs font-normal rounded-full px-2 py-1 ml-2">
          {column.tasks.length}
        </span>
      </h2>
      
      {showLimitWarning && (
        <div className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs p-2 rounded mb-2">
          Limite de tarefas concluídas atingido no plano gratuito.
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {column.tasks.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground text-sm border border-dashed border-white/10 rounded-lg">
            Sem tarefas
          </div>
        ) : (
          column.tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onDelete={onDelete} 
              onUpdate={onUpdate}
              onToggleComplete={() => handleToggleComplete(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}
