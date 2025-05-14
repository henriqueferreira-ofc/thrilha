
import { toast } from '@/hooks/toast';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useTaskCounter } from '../use-task-counter';
import { useSubscription } from '@/hooks/use-subscription';
import { getStatusName } from '@/lib/task-utils';
import { useNavigate } from 'react-router-dom';
import { Board } from '@/types/board';
import { User } from '@supabase/supabase-js';

export function useTaskStatus(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  user: User | null,
  currentBoard: Board | null
) {
  const { limitReached, syncCompletedTasksCount } = useTaskCounter(currentBoard);
  const { isPro } = useSubscription();
  const navigate = useNavigate();

  // Alterar o status de uma tarefa
  const changeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar o status da tarefa');
      return;
    }

    // Encontrar a tarefa atual
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.error('Tarefa não encontrada:', taskId);
      return;
    }
    
    // Verificar se está completando ou descompletando uma tarefa
    const isCompletingTask = newStatus === 'done' && task.status !== 'done';
    const isUncompletingTask = task.status === 'done' && newStatus !== 'done';

    // IMPORTANTE: Só bloqueia a movimentação PARA "done" se atingiu o limite (sem ser Pro)
    // Sempre permitir mover PARA FORA de "done", independente do limite
    if (isCompletingTask && limitReached && !isPro) {
      navigate('/subscription');
      return;
    }

    try {
      // Atualizar o estado local imediatamente para melhor experiência do usuário
      setTasks(prev => {
        return prev.map(t => 
          t.id === taskId
            ? { ...t, status: newStatus }
            : t
        );
      });

      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      // Atualizar o contador imediatamente
      await syncCompletedTasksCount();
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      
      // Reverter alteração em caso de erro
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, status: task.status } : t
        )
      );
    }
  };

  return { changeTaskStatus };
}
