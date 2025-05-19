
import { toast } from '@/hooks/toast';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useTaskCounter } from '../use-task-counter';
import { useSubscription } from '@/hooks/subscription/use-subscription';
import { useNavigate } from 'react-router-dom';
import { Board } from '@/types/board';
import { User } from '@supabase/supabase-js';

export function useTaskStatus(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  user: User | null,
  currentBoard: Board | null
) {
  const { limitReached, syncCompletedTasksCount, incrementCompletedTasks } = useTaskCounter(currentBoard);
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
      toast.error('Limite de tarefas concluídas atingido. Faça upgrade para o plano Pro.');
      navigate('/subscription');
      return;
    }

    try {
      console.log(`Alterando status da tarefa ${taskId} de "${task.status}" para "${newStatus}"`);
      
      // Atualizar o estado local imediatamente para melhor experiência do usuário
      setTasks(prev => {
        return prev.map(t => 
          t.id === taskId
            ? { ...t, status: newStatus }
            : t
        );
      });

      // Atualizar contadores locais se necessário
      if (isCompletingTask) {
        incrementCompletedTasks();
      } else if (isUncompletingTask) {
        decrementCompletedTasks();
      }

      // Enviar atualização para o backend
      console.log('Enviando atualização de status para o servidor...');
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (error) {
        console.error('Erro ao atualizar status no servidor:', error);
        
        // Reverter alteração em caso de erro
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId ? { ...t, status: task.status } : t
          )
        );
        
        throw error;
      }

      // Atualizar o contador se necessário
      await syncCompletedTasksCount();
      
      console.log(`Status da tarefa ${taskId} atualizado com sucesso para "${newStatus}"`);
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  // Função auxiliar para decrementar contador (extraída do useTaskCounter)
  const decrementCompletedTasks = () => {
    if (!currentBoard) return;
    
    const storageKey = `completed_tasks_${currentBoard.id}`;
    const currentCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const newCount = Math.max(0, currentCount - 1);
    
    localStorage.setItem(storageKey, newCount.toString());
    console.log(`Decrementado contador de tarefas concluídas para ${newCount}`);
  };

  return { changeTaskStatus };
}
