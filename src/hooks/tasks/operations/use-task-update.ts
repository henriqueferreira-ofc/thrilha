
import { toast } from 'sonner';
import { Task } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useTaskUpdate(tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const { user } = useAuth();

  // Update a task
  const updateTask = async (id: string, updatedData: Partial<Task>) => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    try {
      console.log('Atualizando tarefa:', { id, updatedData });

      // Atualizar no banco de dados
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          due_date: updatedData.due_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar o estado local
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          if (task.id === id) {
            return {
              ...task,
              ...updatedData,
              updated_at: new Date().toISOString()
            };
          }
          return task;
        });

        console.log('Tarefas após atualização:', updatedTasks);
        return updatedTasks;
      });

      toast.success('Tarefa atualizada com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
      return null;
    }
  };

  return { updateTask };
}
