
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

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompletingTask = newStatus === 'done' && task.status !== 'done';

    // Se está tentando marcar como concluída e já atingiu o limite (sem ser Pro)
    if (isCompletingTask && limitReached && !isPro) {
      toast.error('Você atingiu o limite de tarefas no plano gratuito. Faça upgrade para o plano Pro.');
      return;
    }

    try {
      console.log(`Iniciando alteração de status: tarefa ${taskId} de ${task.status} para ${newStatus}`);
      
      // Atualizar o estado local imediatamente para melhor experiência do usuário
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, status: newStatus, completed: newStatus === 'done' }
            : t
        )
      );

      console.log(`Estado local atualizado. Enviando para o servidor: ${taskId} para ${newStatus}`);

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
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status da tarefa');

        setTasks(prev =>
          prev.map(t =>
            t.id === taskId ? { ...t, status: task.status, completed: task.status === 'done' } : t
          )
        );
        return;
      }

      console.log(`Status alterado com sucesso: ${taskId} para ${newStatus}`);
      toast.success(`Status da tarefa alterado para ${getStatusName(newStatus)}!`);
    } catch (error: unknown) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  return { changeTaskStatus };
}
