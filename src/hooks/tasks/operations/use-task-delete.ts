
import { toast } from 'sonner';
import { Task } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useTaskCounter } from '../use-task-counter';

export function useTaskDelete(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: any | null
) {
  // Integrar o contador de tarefas
  const { decrementCompletedTasks } = useTaskCounter();

  // Excluir uma tarefa
  const deleteTask = async (id: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir tarefas');
      return;
    }

    try {
      // Verificar se a tarefa que está sendo excluída está concluída
      const taskToDelete = tasks.find(task => task.id === id);
      const isCompletedTask = taskToDelete && taskToDelete.status === 'done';
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // Se a tarefa excluída estava concluída, decrementar o contador
      if (isCompletedTask) {
        decrementCompletedTasks();
      }
      
      toast.success('Tarefa removida com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  return { deleteTask };
}
