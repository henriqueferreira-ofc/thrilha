
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
  // Integrar o contador de tarefas e verificador de assinatura
  const { limitReached } = useTaskCounter();
  const { isPro } = useSubscription();

  // Alterar o status de uma tarefa
  const changeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar o status da tarefa');
      return;
    }

    console.log(`Iniciando solicitação para alterar status da tarefa: ${taskId} para ${newStatus}`);

    // Encontra a tarefa no estado atual
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.error('Tarefa não encontrada:', taskId);
      return;
    }
    
    console.log(`Tarefa encontrada: ${task.id}, status atual: ${task.status}, novo status: ${newStatus}`);

    // IMPORTANTE: Só verificar o limite se estiver movendo PARA o status "done"
    // Nunca aplicar esta verificação quando estiver movendo DE "done" para outro status
    const isCompletingTask = newStatus === 'done' && task.status !== 'done';
    const isUncompletingTask = task.status === 'done' && newStatus !== 'done';

    console.log(`isCompletingTask: ${isCompletingTask}, isUncompletingTask: ${isUncompletingTask}, limitReached: ${limitReached}, isPro: ${isPro}`);

    // Se está tentando marcar como concluída e já atingiu o limite (sem ser Pro)
    if (isCompletingTask && limitReached && !isPro) {
      toast.error('Você atingiu o limite de tarefas no plano gratuito. Faça upgrade para o plano Pro.');
      console.log('Tentativa de mover para concluído bloqueada por limite atingido no plano gratuito');
      return;
    }

    try {
      console.log(`Atualizando estado local: tarefa ${taskId} de ${task.status} para ${newStatus}`);
      
      // Atualizar o estado local imediatamente para melhor experiência do usuário
      setTasks(prev => {
        const updatedTasks = prev.map(t => 
          t.id === taskId
            ? { ...t, status: newStatus, completed: newStatus === 'done' }
            : t
        );
        console.log('Estado local atualizado com sucesso');
        return updatedTasks;
      });

      console.log(`Enviando atualização para o servidor: tarefa ${taskId} para status ${newStatus}`);

      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed: newStatus === 'done'
        })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        // Se houver erro, reverter a alteração no estado local
        console.error('Erro ao atualizar status no servidor:', error);
        toast.error('Erro ao atualizar status da tarefa');

        setTasks(prev =>
          prev.map(t =>
            t.id === taskId ? { ...t, status: task.status, completed: task.status === 'done' } : t
          )
        );
        return;
      }

      console.log(`Status alterado com sucesso no servidor: ${taskId} para ${newStatus}`);
      toast.success(`Status da tarefa alterado para ${getStatusName(newStatus)}!`);
    } catch (error: unknown) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  return { changeTaskStatus };
}
