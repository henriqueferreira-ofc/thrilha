
import { Task, TaskStatus } from '@/types/task';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusIndicator } from './StatusIndicator';
import { getStatusName } from '@/lib/task-utils';
import { CalendarPlus, TrashIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  selectedDate: Date | undefined;
}

export const TaskList = ({ 
  tasks, 
  onStatusChange, 
  onDeleteTask,
  selectedDate
}: TaskListProps) => {
  // Formatar a data selecionada para exibição
  const formattedDate = selectedDate 
    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-400 flex flex-col items-center">
        {selectedDate ? (
          <>
            <span className="text-lg mb-2">Nenhuma tarefa para {formattedDate}</span>
            <span className="text-sm">Você pode criar tarefas para este dia através do menu lateral ou botão acima</span>
          </>
        ) : (
          <span>Selecione uma data para ver as tarefas</span>
        )}
      </div>
    );
  }

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    onStatusChange(task.id, newStatus);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h3 className="text-white text-lg">
          {tasks.length} tarefa{tasks.length > 1 ? 's' : ''} para {formattedDate}
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/10">
            <TableHead className="w-20">Status</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className="hover:bg-purple-900/20 border-white/5">
              <TableCell>
                <button
                  onClick={() => toggleTaskStatus(task)}
                  className="hover:opacity-80 transition-opacity"
                  title={`Marcar como ${task.status === 'done' ? 'pendente' : 'concluída'}`}
                >
                  <StatusIndicator status={task.status} />
                </button>
              </TableCell>
              <TableCell className="font-medium">
                <span className={task.status === 'done' ? 'line-through text-zinc-500' : 'text-white'}>
                  {task.title}
                </span>
              </TableCell>
              <TableCell className="text-zinc-400">
                {task.description || '-'}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-2 rounded-full hover:bg-red-900/30 text-red-400 transition-colors"
                  title="Excluir tarefa"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
