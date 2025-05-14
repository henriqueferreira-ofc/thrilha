
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from '@/hooks/toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase/client';

export function useTaskCounter() {
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const navigate = useNavigate();
  
  const FREE_PLAN_LIMIT = 3;

  // Carregar contador de tarefas concluídas quando componente é montado
  useEffect(() => {
    if (user) {
      syncCompletedTasksCount();
    }
  }, [user]);

  // Função para sincronizar o contador com o estado real das tarefas concluídas
  const syncCompletedTasksCount = async () => {
    if (!user) return 0;
    
    try {
      console.log("Sincronizando contador de tarefas concluídas...");
      
      // Verificar número real de tarefas concluídas no banco de dados
      const { data: doneTasks, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'done');

      if (error) {
        console.error("Erro ao buscar tarefas concluídas:", error);
        throw error;
      }
      
      const count = doneTasks?.length || 0;
      console.log(`Sincronizando contador: ${count} tarefas concluídas encontradas`);
      setCompletedTasks(count);
      
      // Verificar se já atingiu o limite logo na carga
      if (!isPro && count >= FREE_PLAN_LIMIT) {
        setShowUpgradeModal(true);
      }
      
      return count;
    } catch (err) {
      console.error('Erro ao sincronizar contador de tarefas:', err);
      return 0;
    }
  };

  // Incrementar contador de tarefas concluídas
  const incrementCompletedTasks = async () => {
    if (!user || isPro) return; // Não contabiliza para usuários Pro

    const newCount = completedTasks + 1;
    console.log(`Incrementando contador de ${completedTasks} para ${newCount}`);
    setCompletedTasks(newCount);
    
    // Verificar se atingiu o limite
    if (newCount >= FREE_PLAN_LIMIT) {
      setShowUpgradeModal(true);
      
      toast({
        title: "Limite de tarefas concluídas atingido!",
        description: "Você atingiu o limite de tarefas concluídas do plano gratuito.",
        variant: "destructive"
      });
      
      // Redirecionar para a página de planos
      navigate('/subscription');
    } else if (newCount === FREE_PLAN_LIMIT - 1) {
      // Aviso quando estiver próximo do limite
      toast({
        title: "Aviso de limite",
        description: `Você está próximo do limite de tarefas concluídas (${newCount}/${FREE_PLAN_LIMIT}).`,
        variant: "default"
      });
    }
  };

  // Decrementar contador quando tarefa for movida de "concluída" para outro status
  const decrementCompletedTasks = () => {
    if (!user || isPro) return; // Não contabiliza para usuários Pro

    const newCount = Math.max(0, completedTasks - 1);
    console.log(`Decrementando contador de ${completedTasks} para ${newCount}`);
    setCompletedTasks(newCount);
  };

  // Resetar contador
  const resetCounter = () => {
    setCompletedTasks(0);
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
    decrementCompletedTasks,
    syncCompletedTasksCount,
    resetCounter,
    showUpgradeModal,
    closeUpgradeModal,
    limitReached: !isPro && completedTasks >= FREE_PLAN_LIMIT
  };
}
