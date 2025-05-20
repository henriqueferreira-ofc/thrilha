
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useTaskStatus(tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const { user } = useAuth();

  // Change task status
  const changeTaskStatus = async (id: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar o status das tarefas');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          if (task.id === id) {
            return {
              ...task,
              status: newStatus,
              updated_at: new Date().toISOString()
            };
          }
          return task;
        });

        console.log('Tarefas após mudança de status:', updatedTasks);
        return updatedTasks;
      });

      toast.success('Status da tarefa atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
      toast.error('Erro ao alterar status da tarefa');
    }
  };

  return { changeTaskStatus };
}
