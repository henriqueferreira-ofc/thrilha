
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/hooks/use-toast';

export function useTaskCounter() {
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { toast } = useToast();
  
  const FREE_PLAN_LIMIT = 3;

  // Carregar contador do localStorage quando componente é montado
  useEffect(() => {
    if (user) {
      const storedCount = localStorage.getItem(`taskCounter_${user.id}`);
      if (storedCount) {
        setCompletedTasks(parseInt(storedCount));
      }
    }
  }, [user]);

  // Incrementar contador de tarefas concluídas
  const incrementCompletedTasks = () => {
    if (!user || isPro) return; // Não contabiliza para usuários Pro

    const newCount = completedTasks + 1;
    setCompletedTasks(newCount);
    
    // Persistir no localStorage
    if (user) {
      localStorage.setItem(`taskCounter_${user.id}`, newCount.toString());
    }
    
    // Verificar se atingiu o limite
    if (newCount >= FREE_PLAN_LIMIT && !isPro) {
      setShowUpgradeModal(true);
      toast({
        title: "Limite de tarefas atingido!",
        description: "Você atingiu o limite de tarefas concluídas do plano gratuito.",
        variant: "destructive"
      });
    } else if (newCount === FREE_PLAN_LIMIT - 1) {
      // Aviso quando estiver próximo do limite
      toast({
        title: "Aviso de limite",
        description: `Você está próximo do limite de tarefas concluídas (${newCount}/${FREE_PLAN_LIMIT}).`,
        variant: "warning"
      });
    }
  };

  // Resetar contador
  const resetCounter = () => {
    setCompletedTasks(0);
    if (user) {
      localStorage.removeItem(`taskCounter_${user.id}`);
    }
    setShowUpgradeModal(false);
  };

  // Fechar modal de upgrade
  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
  };

  return {
    completedTasks,
    remainingTasks: Math.max(0, FREE_PLAN_LIMIT - completedTasks),
    totalLimit: FREE_PLAN_LIMIT,
    incrementCompletedTasks,
    resetCounter,
    showUpgradeModal,
    closeUpgradeModal,
    limitReached: completedTasks >= FREE_PLAN_LIMIT && !isPro
  };
}
