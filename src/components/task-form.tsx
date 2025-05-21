
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TaskFormData } from '@/types/task';
import { format, parseISO, startOfDay } from 'date-fns';
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
    initialData.dueDate ? startOfDay(parseISO(initialData.dueDate)) : undefined
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
        description: description.trim() || '',
        dueDate: date ? startOfDay(date).toISOString() : null,
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
          className="bg-black/50 border-white/20"
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
          className="bg-black/50 border-white/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="due-date">Data (opcional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-black/50 border-white/20",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
              {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : (
                <span>Selecionar data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#1a1c23] border-white/10" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(startOfDay(newDate))}
              initialFocus
              locale={ptBR}
              month={currentMonth}
              onMonthChange={handleMonthChange}
              className="pointer-events-auto bg-[#1a1c23]"
              disabled={(date) => date < startOfDay(new Date())}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
      </Button>
    </form>
  );
}
