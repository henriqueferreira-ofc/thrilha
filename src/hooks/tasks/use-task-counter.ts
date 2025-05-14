
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from '@/hooks/toast';
import { useNavigate } from 'react-router-dom';

export function useTaskCounter() {
  const [createdTasks, setCreatedTasks] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const navigate = useNavigate();
  
  const FREE_PLAN_LIMIT = 3;

  // Carregar contador do localStorage quando componente é montado
  useEffect(() => {
    if (user) {
      const storedCount = localStorage.getItem(`taskCreatedCounter_${user.id}`);
      if (storedCount) {
        setCreatedTasks(parseInt(storedCount));
      }
    }
  }, [user]);

  // Incrementar contador de tarefas criadas
  const incrementCreatedTasks = () => {
    if (!user || isPro) return; // Não contabiliza para usuários Pro

    const newCount = createdTasks + 1;
    setCreatedTasks(newCount);
    
    // Persistir no localStorage
    if (user) {
      localStorage.setItem(`taskCreatedCounter_${user.id}`, newCount.toString());
    }
    
    // Verificar se atingiu o limite
    if (newCount >= FREE_PLAN_LIMIT && !isPro) {
      setShowUpgradeModal(true);
      toast({
        title: "Limite de tarefas atingido!",
        description: "Você atingiu o limite de tarefas criadas do plano gratuito.",
        variant: "destructive"
      });
      
      // Redirecionar para a página de planos
      navigate('/subscription');
    } else if (newCount === FREE_PLAN_LIMIT - 1) {
      // Aviso quando estiver próximo do limite
      toast({
        title: "Aviso de limite",
        description: `Você está próximo do limite de tarefas criadas (${newCount}/${FREE_PLAN_LIMIT}). No plano gratuito, você pode criar até ${FREE_PLAN_LIMIT} tarefas.`,
        variant: "default"
      });
    }
  };

  // Resetar contador
  const resetCounter = () => {
    setCreatedTasks(0);
    if (user) {
      localStorage.removeItem(`taskCreatedCounter_${user.id}`);
    }
    setShowUpgradeModal(false);
  };

  // Fechar modal de upgrade
  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
  };

  return {
    createdTasks,
    remainingTasks: Math.max(0, FREE_PLAN_LIMIT - createdTasks),
    totalLimit: FREE_PLAN_LIMIT,
    incrementCreatedTasks,
    resetCounter,
    showUpgradeModal,
    closeUpgradeModal,
    limitReached: createdTasks >= FREE_PLAN_LIMIT && !isPro
  };
}
