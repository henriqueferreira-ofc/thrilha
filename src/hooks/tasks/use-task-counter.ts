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
    if (!user) return 0;
    
    try {
      console.log("Sincronizando contador de tarefas para o usuário:", user.id);
      
      // Consulta para contar todas as tarefas do usuário, independente do quadro
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('user_id', user.id);

      if (error) {
        console.error("Erro ao buscar tarefas:", error);
        throw error;
      }
      
      // Garantir que não haja duplicatas e contar apenas tarefas únicas
      const uniqueTasks = Array.from(new Set(allTasks?.map(task => task.id) || []));
      const tasksCount = uniqueTasks.length;
      
      console.log(`Sincronizado: ${tasksCount} tarefas únicas no total para o usuário ${user.id}`);
      
      // Atualizar o estado local imediatamente
      setTotalTasks(tasksCount);
      
      // Verificar se já atingiu o limite logo na carga (apenas para usuários sem plano Pro)
      if (!isPro && tasksCount >= FREE_PLAN_LIMIT) {
        console.log(`Limite atingido durante sincronização: ${tasksCount}/${FREE_PLAN_LIMIT}`);
        setShowUpgradeModal(true);
      }
      
      return tasksCount;
    } catch (err) {
      console.error('Erro ao sincronizar contador de tarefas:', err);
      return 0;
    }
  }, [user, isPro]);

  // Carregar contador de tarefas quando componente é montado ou quando muda o usuário
  useEffect(() => {
    if (user) {
      syncCompletedTasksCount();

      // Inscrever para atualizações em tempo real
      const tasksSubscription = supabase
        .channel('tasks_counter')
        .on('postgres_changes', {
          event: '*', 
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Mudança detectada em tarefas, atualizando contador', payload);
          // Atualizar o contador imediatamente quando houver mudanças
          syncCompletedTasksCount();
        })
        .subscribe();

      return () => {
        console.log('Removendo inscrição do contador de tarefas');
        supabase.removeChannel(tasksSubscription);
      };
    }
  }, [user, syncCompletedTasksCount]);

  // Função para incrementar o contador
  const incrementTaskCount = useCallback(() => {
    setTotalTasks(prev => {
      const newCount = prev + 1;
      if (!isPro && newCount >= FREE_PLAN_LIMIT) {
        setShowUpgradeModal(true);
      }
      return newCount;
    });
  }, [isPro]);

  // Função para decrementar o contador
  const decrementTaskCount = useCallback(() => {
    setTotalTasks(prev => Math.max(0, prev - 1));
  }, []);

  // Incrementar contador de tarefas
  const incrementCompletedTasks = async () => {
    // Se o usuário tem plano Pro, não precisa verificar limites
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
    // Se o usuário tem plano Pro, não precisa verificar limites
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
  
  // Função para resetar o contador
  const resetCounter = () => {
    setTotalTasks(0);
    syncCompletedTasksCount();
  };

  // Para usuários Pro, alguns valores são diferentes
  const effectiveTotalLimit = isPro ? Infinity : FREE_PLAN_LIMIT;
  const effectiveRemainingTasks = isPro ? Infinity : Math.max(0, FREE_PLAN_LIMIT - totalTasks);
  const effectiveLimitReached = isPro ? false : totalTasks >= FREE_PLAN_LIMIT;

  return {
    totalTasks,
    remainingTasks: effectiveRemainingTasks,
    totalLimit: effectiveTotalLimit,
    incrementCompletedTasks,
    decrementCompletedTasks,
    syncCompletedTasksCount,
    showUpgradeModal,
    closeUpgradeModal: () => setShowUpgradeModal(false),
    limitReached: effectiveLimitReached,
    resetCounter
  };
}
