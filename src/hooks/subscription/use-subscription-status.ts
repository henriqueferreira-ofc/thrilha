
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/board';

// API functions
import { 
  fetchUserSubscriptionAPI,
  checkSubscriptionStatusAPI,
  setupSubscriptionListener
} from './api';

/**
 * Hook para gerenciar o status da assinatura
 */
export function useSubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Determinar se o usuário tem plano Pro
  const isPro = subscription?.plan_type === 'pro' && 
                subscription?.status === 'active';

  /**
   * Buscar dados da assinatura do usuário
   */
  const fetchUserSubscription = useCallback(async () => {
    if (!user) return false;
    
    try {
      setLoading(true);
      const userId = user.id;
      console.log('Buscando assinatura para usuário:', userId);
      
      const { data, error } = await fetchUserSubscriptionAPI(userId);
      
      if (error) {
        console.error('Erro ao buscar assinatura:', error);
        toast.error('Não foi possível obter informações de sua assinatura');
        return false;
      }

      console.log('Dados de assinatura obtidos:', data);
      setSubscription(data);
      return true;
    } catch (error) {
      console.error('Exceção ao buscar assinatura:', error);
      toast.error('Erro ao verificar sua assinatura');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Verificar status da assinatura diretamente com o Stripe
   */
  const checkSubscriptionStatus = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para verificar seu plano');
      return false;
    }
    
    try {
      setLoading(true);
      const userId = user.id;
      console.log('Verificando status de assinatura com Stripe para:', userId);
      
      const { success, data } = await checkSubscriptionStatusAPI(userId);
      
      if (!success) {
        toast.error('Não foi possível verificar o status de sua assinatura');
        return false;
      }

      console.log('Status de assinatura atualizado com dados do Stripe:', data);
      await fetchUserSubscription();
      return true;
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
      toast.error('Erro ao verificar status da assinatura');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchUserSubscription]);

  // Carregar dados da assinatura quando o usuário é autenticado
  useEffect(() => {
    if (user) {
      fetchUserSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user, fetchUserSubscription]);

  // Configurar listener para atualizações em tempo real na assinatura
  useEffect(() => {
    if (!user) return;
    
    const handleSubscriptionUpdate = (data: SubscriptionPlan) => {
      console.log('Assinatura atualizada em tempo real:', data);
      setSubscription(data);
      
      // Notificar o usuário sobre mudanças na assinatura
      if (data.plan_type === 'pro' && data.status === 'active') {
        toast.success('Sua assinatura Pro está ativa!');
      } else if (data.plan_type === 'free' || data.status !== 'active') {
        toast.info('Sua assinatura foi alterada para o plano gratuito');
      }
    };
    
    const handleSubscriptionDelete = () => {
      console.log('Assinatura cancelada');
      setSubscription(null);
      toast.info('Sua assinatura foi cancelada');
    };

    // Configurar o listener de tempo real
    const subscription = setupSubscriptionListener(
      user.id,
      handleSubscriptionUpdate,
      handleSubscriptionDelete
    );
    
    return () => {
      // Limpar o listener ao desmontar
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    subscription,
    loading,
    isPro,
    checkSubscriptionStatus,
    fetchUserSubscription
  };
}
