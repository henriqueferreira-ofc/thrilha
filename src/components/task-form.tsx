import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TaskFormData } from '@/types/task';

interface TaskFormProps {
  initialData?: {
    title?: string;
    description?: string;
    dueDate?: string;
  };
  onSubmit: (data: TaskFormData) => void;
}

export function TaskForm({ initialData = {}, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [dueDate, setDueDate] = useState(initialData.dueDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
    });

    // Reset form if it's a new task (no initialData)
    if (!initialData.title) {
      setTitle('');
      setDescription('');
      setDueDate('');
    }
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

      <div>
        <Label htmlFor="due-date">Data (opcional)</Label>
        <Input
          id="due-date"
          type="date"
          value={dueDate ? dueDate.split('T')[0] : ''}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full">
        {initialData.title ? 'Salvar Alterações' : 'Criar Tarefa'}
      </Button>
    </form>
  );
}
