
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useTaskCounter } from '../use-task-counter';
import { useSubscription } from '@/hooks/use-subscription';
import { getStatusName } from '@/lib/task-utils';

export function useTaskStatus(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  user: any | null
) {
  const { limitReached, incrementCompletedTasks, decrementCompletedTasks } = useTaskCounter();
  const { isPro } = useSubscription();

  // Alterar o status de uma tarefa
  const changeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar o status da tarefa');
      return;
    }

    console.log(`Iniciando mudança de status da tarefa ${taskId} para ${newStatus}`);

    // Encontrar a tarefa atual
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.error('Tarefa não encontrada:', taskId);
      return;
    }
    
    // Verificar se está completando ou descompletando uma tarefa
    const isCompletingTask = newStatus === 'done' && task.status !== 'done';
    const isUncompletingTask = task.status === 'done' && newStatus !== 'done';

    console.log(`isCompletingTask: ${isCompletingTask}, isUncompletingTask: ${isUncompletingTask}, limitReached: ${limitReached}, isPro: ${isPro}`);

    // IMPORTANTE: Só bloqueia a movimentação PARA "done" se atingiu o limite (sem ser Pro)
    // Sempre permitir mover PARA FORA de "done", independente do limite
    if (isCompletingTask && limitReached && !isPro) {
      toast.error('Você atingiu o limite de tarefas concluídas no plano gratuito. Faça upgrade para o plano Pro.');
      console.log('Limite de tarefas concluídas atingido!');
      return;
    }

    try {
      // Atualizar o estado local imediatamente para melhor experiência do usuário
      setTasks(prev => {
        return prev.map(t => 
          t.id === taskId
            ? { ...t, status: newStatus, completed: newStatus === 'done' }
            : t
        );
      });

      console.log(`Enviando atualização para o servidor: tarefa ${taskId} para status ${newStatus}`);

      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed: newStatus === 'done'
        })
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      // Atualizar o contador de tarefas concluídas
      if (isCompletingTask) {
        console.log('Incrementando contador de tarefas concluídas');
        await incrementCompletedTasks();
      } else if (isUncompletingTask) {
        console.log('Decrementando contador de tarefas concluídas');
        await decrementCompletedTasks();
      }

      toast.success(`Status da tarefa alterado para ${getStatusName(newStatus)}!`);
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
      
      // Reverter alteração em caso de erro
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, status: task.status, completed: task.status === 'done' } : t
        )
      );
    }
  };

  return { changeTaskStatus };
}
