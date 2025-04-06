
import { useDrop } from 'react-dnd';
import { Task, Column, TaskStatus } from '@/types/task';
import { TaskCard } from '@/components/task-card';

interface TaskColumnProps {
  column: Column;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<Task>) => void;
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
}

export function TaskColumn({ column, onDelete, onUpdate, onDrop }: TaskColumnProps) {
  // Set up drop functionality
  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item: { id: string }) => {
      console.log(`Tarefa ${item.id} sendo movida para ${column.id}`);
      onDrop(item.id, column.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Estilo específico para cada tipo de coluna
  const getColumnStyle = () => {
    switch (column.id) {
      case 'todo':
        return 'border-t-4 border-t-purple-500/70';
      case 'inProgress':
        return 'border-t-4 border-t-blue-500/70';
      case 'done':
        return 'border-t-4 border-t-green-500/70';
      default:
        return '';
    }
  };

  return (
    <div 
      ref={drop}
      className={`flex flex-col h-full p-4 rounded-lg glass-panel transition-all duration-300 ${getColumnStyle()} ${
        isOver ? 'scale-105 bg-purple-900/20 shadow-lg' : ''
      }`}
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        {column.title}
        <span className="bg-white/10 text-xs font-normal rounded-full px-2 py-1 ml-2">
          {column.tasks.length}
        </span>
      </h2>
      <div className="flex-1 overflow-y-auto">
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
            />
          ))
        )}
      </div>
    </div>
  );
}
