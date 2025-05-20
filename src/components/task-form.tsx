
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TaskFormData } from '@/types/task';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskFormProps {
  initialData?: {
    title?: string;
    description?: string;
    dueDate?: string;
  };
  onSubmit: (data: TaskFormData) => void;
  boardId?: string;
}

export function TaskForm({ initialData = {}, onSubmit, boardId }: TaskFormProps) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [date, setDate] = useState<Date | undefined>(
    initialData.dueDate ? new Date(initialData.dueDate) : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('O título da tarefa é obrigatório');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: date ? date.toISOString() : undefined,
        board_id: boardId
      });

      // Reset form if it's a new task (no initialData)
      if (!initialData.title) {
        setTitle('');
        setDescription('');
        setDate(undefined);
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para lidar com a mudança de mês
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  // Verificar se há um quadro selecionado
  const isBoardMissing = !boardId || boardId === 'undefined' || boardId === '';
  
  useEffect(() => {
    if (isBoardMissing) {
      console.log('Aviso: boardId não definido no TaskForm');
    }
  }, [isBoardMissing]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da tarefa"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes da tarefa..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="due-date">Data (opcional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : (
                <span>Selecionar data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              locale={ptBR}
              month={currentMonth}
              onMonthChange={handleMonthChange}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isBoardMissing || isSubmitting}
      >
        {isSubmitting ? 'Criando...' : (initialData.title ? 'Salvar Alterações' : 'Criar Tarefa')}
      </Button>
      
      {isBoardMissing && (
        <p className="text-sm text-orange-500 text-center">
          Selecione um quadro primeiro
        </p>
      )}
    </form>
  );
}
