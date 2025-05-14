
import { useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Task, TaskStatus } from '@/types/task';
import { TaskColumn } from '@/components/task-column';
import { groupTasksByStatus } from '@/lib/task-utils';

interface TaskBoardProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<Task>) => void;
  onChangeStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export function TaskBoard({ tasks = [], onDelete, onUpdate, onChangeStatus }: TaskBoardProps) {
  // Log do estado inicial das tarefas para debug
  useEffect(() => {
    console.log('TaskBoard: Tarefas carregadas:', tasks.length);
    if (tasks.length > 0) {
      console.log('TaskBoard: Distribuição de tarefas por status:', 
        tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );
    }
  }, [tasks]);

  // Agrupar tarefas por status
  const columns = useMemo(() => 
    groupTasksByStatus(Array.isArray(tasks) ? tasks : []), 
    [tasks]
  );

  // Handler para mudar status via drag & drop
  const handleDrop = (taskId: string, newStatus: TaskStatus) => {
    console.log(`TaskBoard: Solicitando mudança de status da tarefa ${taskId} para ${newStatus}`);
    
    // Encontrar tarefa atual para logging
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (task.status !== newStatus) {
        console.log(`TaskBoard: Alterando status de "${task.status}" para "${newStatus}"`);
        // Só chamar onChangeStatus se o status for diferente
        onChangeStatus(taskId, newStatus);
      } else {
        console.log(`TaskBoard: Tarefa já está no status ${newStatus}, ignorando`);
      }
    } else {
      console.error(`TaskBoard: Tarefa com ID ${taskId} não encontrada`);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 p-6">
        {columns.map((column) => (
          <TaskColumn
            key={column.id}
            column={column}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </DndProvider>
  );
}
