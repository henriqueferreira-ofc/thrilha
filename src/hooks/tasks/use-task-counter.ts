
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase/client';
import { Board } from '@/types/board';

export function useTaskCounter(currentBoard: Board | null = null) {
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const navigate = useNavigate();
  
  const FREE_PLAN_LIMIT = 3;

  // Função para sincronizar o contador com o estado real das tarefas
  const syncCompletedTasksCount = useCallback(async () => {
    if (!user || !currentBoard) return 0;
    
    try {
      console.log("Sincronizando contador de tarefas...");
      
      // Verificar número total de tarefas no banco de dados para o quadro atual
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('board_id', currentBoard.id);

      if (error) {
        console.error("Erro ao buscar tarefas:", error);
        throw error;
      }
      
      const count = allTasks?.length || 0;
      console.log(`Sincronizado: ${count} tarefas encontradas no quadro ${currentBoard.id}`);
      setTotalTasks(count);
      
      // Verificar se já atingiu o limite logo na carga
      if (!isPro && count >= FREE_PLAN_LIMIT) {
        console.log(`Limite atingido durante sincronização: ${count}/${FREE_PLAN_LIMIT}`);
        setShowUpgradeModal(true);
      }
      
      return count;
    } catch (err) {
      console.error('Erro ao sincronizar contador de tarefas:', err);
      return 0;
    }
  }, [user, isPro, currentBoard]);

  // Carregar contador de tarefas quando componente é montado ou quando muda o quadro
  useEffect(() => {
    if (user && currentBoard) {
      syncCompletedTasksCount();

      // Inscrever para atualizações em tempo real
      const tasksSubscription = supabase
        .channel('tasks_counter')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id} AND board_id=eq.${currentBoard.id}`
        }, () => {
          syncCompletedTasksCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(tasksSubscription);
      };
    }
  }, [user, currentBoard, syncCompletedTasksCount]);

  // Incrementar contador de tarefas
  const incrementCompletedTasks = async () => {
    if (!user || isPro) return;

    // Atualizar o estado imediatamente para feedback instantâneo
    const newCount = totalTasks + 1;
    setTotalTasks(newCount);
    console.log(`Incrementando contador de ${totalTasks} para ${newCount}`);
    
    // Verificar se atingiu o limite
    if (newCount >= FREE_PLAN_LIMIT) {
      setShowUpgradeModal(true);
      
      toast("Limite de tarefas atingido! Você atingiu o limite de tarefas do plano gratuito.");
      
      navigate('/subscription');
    } else if (newCount === FREE_PLAN_LIMIT - 1) {
      // Aviso quando estiver próximo do limite
      toast("Aviso de limite: Você está próximo do limite de tarefas.");
    }

    // Sincronizar com o servidor em segundo plano
    await syncCompletedTasksCount();
  };

  // Decrementar contador quando uma tarefa for excluída
  const decrementCompletedTasks = () => {
    if (!user || isPro) return;

    // Atualizar o estado imediatamente para feedback instantâneo
    const newCount = Math.max(0, totalTasks - 1);
    setTotalTasks(newCount);
    console.log(`Decrementando contador de ${totalTasks} para ${newCount}`);
    
    // Se estava no limite e decrementou, não mostrar mais o modal
    if (totalTasks >= FREE_PLAN_LIMIT && newCount < FREE_PLAN_LIMIT) {
      setShowUpgradeModal(false);
    }

    // Sincronizar com o servidor em segundo plano
    syncCompletedTasksCount();
  };
  
  // Adicionar a função resetCounter que está faltando
  const resetCounter = (board: Board | null = null) => {
    if (board) {
      syncCompletedTasksCount();
    } else {
      setTotalTasks(0);
    }
  };

  return {
    totalTasks,
    remainingTasks: Math.max(0, FREE_PLAN_LIMIT - totalTasks),
    totalLimit: FREE_PLAN_LIMIT,
    incrementCompletedTasks,
    decrementCompletedTasks,
    syncCompletedTasksCount,
    showUpgradeModal,
    closeUpgradeModal: () => setShowUpgradeModal(false),
    limitReached: !isPro && totalTasks >= FREE_PLAN_LIMIT,
    resetCounter
  };
}
