
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useTaskCounter } from '../use-task-counter';
import { useSubscription } from '@/hooks/use-subscription';

export function useTaskStatus(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: any | null
) {
  // Integrar o contador de tarefas e verificador de assinatura
  const { incrementCreatedTasks, limitReached } = useTaskCounter();
  const { isPro } = useSubscription();

  // Alterar o status de uma tarefa
  const changeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    // Verificar se a tarefa está sendo marcada como concluída
    const targetTask = tasks.find(task => task.id === taskId);
    const isCompletingTask = newStatus === 'done' && targetTask?.status !== 'done';

    // Se está tentando marcar como concluída e já atingiu o limite (sem ser Pro)
    if (isCompletingTask && limitReached && !isPro) {
      toast.error('Você atingiu o limite de tarefas no plano gratuito. Faça upgrade para o plano Pro.');
      return;
    }

    try {
      // Atualizar o estado local imediatamente
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, completed: newStatus === 'done' }
            : task
        )
      );

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        // Se houver erro, reverter a alteração local
        setTasks(prev => 
          prev.map(task => 
            task.id === taskId 
              ? { ...task, status: task.status }
              : task
          )
        );
        throw error;
      }

      // Se a tarefa foi concluída (mudada para 'done'), incrementar o contador
      if (isCompletingTask) {
        incrementCreatedTasks();
      }

      toast.success(`Status da tarefa alterado para ${getStatusName(newStatus)}!`);
    } catch (error: unknown) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  // Função auxiliar para obter o nome legível do status
  const getStatusName = (status: TaskStatus): string => {
    switch (status) {
      case 'todo': return 'A Fazer';
      case 'in-progress': return 'Em Progresso';
      case 'done': return 'Concluída';
      default: return status;
    }
  };

  return { changeTaskStatus };
}
