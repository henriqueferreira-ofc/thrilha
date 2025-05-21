
import { Task } from '@/types/task';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusIndicator } from './StatusIndicator';

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: Task['status']) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  selectedDate: Date | undefined;
}

export const TaskList = ({ 
  tasks, 
  onStatusChange, 
  onDeleteTask,
  selectedDate
}: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        {selectedDate 
          ? 'Nenhuma tarefa para esta data' 
          : 'Selecione uma data para ver as tarefas'}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <button
                onClick={() => onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
                className="hover:opacity-80 transition-opacity"
              >
                <StatusIndicator status={task.status} />
              </button>
            </TableCell>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell className="text-muted-foreground">{task.description || '-'}</TableCell>
            <TableCell>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                Excluir
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
