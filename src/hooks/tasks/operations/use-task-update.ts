
import { toast } from 'sonner';
import { Task } from '@/types/task';
import { supabase } from '@/supabase/client';

export function useTaskUpdate(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: any | null
) {
  // Atualizar uma tarefa
  const updateTask = async (id: string, updatedData: Partial<Task>): Promise<void> => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    try {
      // Converter de volta para o formato do banco de dados
      const dbData = {
        title: updatedData.title,
        description: updatedData.description,
        status: updatedData.status,
        due_date: updatedData.due_date
      };

      const { error } = await supabase
        .from('tasks')
        .update(dbData)
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updatedData } : task
      ));

      toast.success('Tarefa atualizada com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar tarefa');
    }
  };

  return { updateTask };
}
