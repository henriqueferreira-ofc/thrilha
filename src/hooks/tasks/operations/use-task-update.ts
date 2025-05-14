
import { toast } from '@/hooks/toast';
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
      console.log(`Atualizando tarefa ${id} com dados:`, updatedData);
      
      // Atualização otimista - aplicar mudança ao estado local imediatamente
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updatedData } : task
      ));

      // Converter de volta para o formato do banco de dados
      const dbData = {
        title: updatedData.title,
        description: updatedData.description,
        status: updatedData.status,
        due_date: updatedData.due_date,
        updated_at: new Date().toISOString() // Garantir que o updated_at seja atualizado
      };

      // Enviar para o servidor
      console.log('Enviando atualização para o servidor...');
      const { error } = await supabase
        .from('tasks')
        .update(dbData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar no servidor:', error);
        
        // Reverter alterações em caso de erro (precisaríamos do estado anterior)
        const originalTask = tasks.find(t => t.id === id);
        if (originalTask) {
          setTasks(prev => prev.map(task => 
            task.id === id ? originalTask : task
          ));
        }
        
        throw error;
      }

      console.log(`Tarefa ${id} atualizada com sucesso`);
      toast.success('Tarefa atualizada com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar tarefa');
    }
  };

  return { updateTask };
}
