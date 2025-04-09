
import { useState } from 'react';
import { Calendar, MoreHorizontal, Edit, Trash2, Users, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Task } from '@/types/task';
import { formatDate } from '@/lib/task-utils';
import { TaskForm } from '@/components/task-form';
import { TaskCollaborators } from '@/components/task-collaborators';
import { useDrag } from 'react-dnd';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<Task>) => void;
}

export function TaskCard({ task, onDelete, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingCollaborators, setIsManagingCollaborators] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const handleManageCollaborators = () => {
    setIsManagingCollaborators(true);
  };

  const handleUpdate = (updatedData: Partial<Task>) => {
    onUpdate(task.id, updatedData);
    setIsEditing(false);
  };

  // Determinando a cor de fundo com base no status da tarefa
  const getBackgroundStyle = () => {
    switch (task.status) {
      case 'todo':
        return 'bg-purple-500/20 hover:bg-purple-500/30 border-l-4 border-purple-500';
      case 'inProgress': 
        return 'bg-blue-500/20 hover:bg-blue-500/30 border-l-4 border-blue-500';
      case 'done':
        return 'bg-green-500/20 hover:bg-green-500/30 border-l-4 border-green-500';
      default:
        return 'bg-purple-500/20 hover:bg-purple-500/30';
    }
  };

  // Verifica se a data de vencimento está próxima (menos de 3 dias)
  const isDueSoon = () => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  // Verifica se a tarefa está atrasada
  const isOverdue = () => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate < today && task.status !== 'done';
  };

  // Formata a data de vencimento 
  const formatTaskDueDate = () => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    return format(dueDate, "dd 'de' MMM", { locale: ptBR });
  };

  return (
    <>
      <Card 
        ref={drag}
        className={`mb-3 p-4 cursor-grab animate-fade-in transition-all duration-300 ${getBackgroundStyle()} ${isHovered ? 'scale-105 shadow-lg' : ''} ${isDragging ? 'opacity-50' : ''}`} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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
              <DropdownMenuItem onClick={handleManageCollaborators}>
                <Users className="mr-2 h-4 w-4" />
                Colaboradores
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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

        <div className="mt-3 flex items-center justify-between">
          {task.dueDate && (
            <div className={`flex items-center text-xs ${isOverdue() ? 'text-red-400' : isDueSoon() ? 'text-amber-400' : 'text-muted-foreground'}`}>
              {isOverdue() ? (
                <CalendarClock size={14} className="mr-1 animate-pulse" />
              ) : (
                <Calendar size={14} className="mr-1" />
              )}
              {formatTaskDueDate()}
            </div>
          )}
          
          <Badge variant="outline" className="ml-auto bg-purple-500/10 text-purple-300 hover:bg-purple-500/20">
            <Users size={12} className="mr-1" />
            Equipe
          </Badge>
        </div>
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

      <Dialog open={isManagingCollaborators} onOpenChange={setIsManagingCollaborators}>
        <DialogContent className="glass-panel sm:max-w-[500px]">
          <DialogTitle>Gerenciar Colaboradores</DialogTitle>
          <TaskCollaborators taskId={task.id} />
        </DialogContent>
      </Dialog>
    </>
  );
}
