
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/board';

// API functions
import { 
  createCheckoutSessionAPI, 
  createCustomerPortalSessionAPI,
  fetchUserSubscriptionAPI,
  checkSubscriptionStatusAPI,
  setupSubscriptionListener
} from './api';

/**
 * Hook para gerenciar assinaturas do usuário
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determinar se o usuário tem plano Pro
  const isPro = subscription?.plan_type === 'pro' && 
                subscription?.status === 'active';

  /**
   * Buscar dados da assinatura do usuário
   */
  const fetchUserSubscription = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userId = user.id;
      console.log('Buscando assinatura para usuário:', userId);
      
      const { data, error } = await fetchUserSubscriptionAPI(userId);
      
      if (error) {
        console.error('Erro ao buscar assinatura:', error);
        toast.error('Não foi possível obter informações de sua assinatura');
        return;
      }

      console.log('Dados de assinatura obtidos:', data);
      setSubscription(data);
    } catch (error) {
      console.error('Exceção ao buscar assinatura:', error);
      toast.error('Erro ao verificar sua assinatura');
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
      navigate('/auth');
      return;
    }
    
    try {
      setLoading(true);
      const userId = user.id;
      console.log('Verificando status de assinatura com Stripe para:', userId);
      
      const { success, data } = await checkSubscriptionStatusAPI(userId);
      
      if (!success) {
        toast.error('Não foi possível verificar o status de sua assinatura');
        return;
      }

      console.log('Status de assinatura atualizado com dados do Stripe:', data);
      await fetchUserSubscription();
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
      toast.error('Erro ao verificar status da assinatura');
    } finally {
      setLoading(false);
    }
  }, [user, navigate, fetchUserSubscription]);

  /**
   * Upgrade para plano Pro
   */
  const upgradeToPro = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para assinar o plano Pro');
      navigate('/auth');
      return;
    }
    
    try {
      setCheckingOut(true);
      console.log('Iniciando checkout para plano Pro');
      
      const { success, url, error } = await createCheckoutSessionAPI();
      
      if (!success || !url) {
        console.error('Erro no checkout:', error);
        toast.error(`Erro ao iniciar checkout: ${error || 'Falha na comunicação'}`);
        return;
      }

      console.log('Redirecionando para URL de checkout:', url);
      // Usar redirecionamento com window.location para garantir mudança completa de contexto
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      toast.error('Não foi possível iniciar o processo de assinatura');
    } finally {
      setCheckingOut(false);
    }
  }, [user, navigate]);

  /**
   * Downgrade para plano gratuito
   */
  const downgradeToFree = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para gerenciar seu plano');
      navigate('/auth');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Iniciando downgrade para plano gratuito');
      
      const { success, url, error } = await createCustomerPortalSessionAPI();
      
      if (!success || !url) {
        console.error('Erro ao acessar portal:', error);
        toast.error(`Erro ao acessar portal de gerenciamento: ${error || 'Falha na comunicação'}`);
        return;
      }

      console.log('Redirecionando para portal de gerenciamento:', url);
      // Usar redirecionamento com window.location para garantir mudança completa de contexto
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao fazer downgrade:', error);
      toast.error('Não foi possível acessar o portal de gerenciamento');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  /**
   * Gerenciar assinatura existente
   */
  const manageSubscription = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para gerenciar sua assinatura');
      navigate('/auth');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Acessando portal de gerenciamento da assinatura');
      
      const { success, url, error } = await createCustomerPortalSessionAPI();
      
      if (!success || !url) {
        console.error('Erro ao acessar portal:', error);
        toast.error(`Erro ao acessar portal de gerenciamento: ${error || 'Falha na comunicação'}`);
        return;
      }

      console.log('Redirecionando para portal de gerenciamento:', url);
      // Usar redirecionamento com window.location para garantir mudança completa de contexto
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao gerenciar assinatura:', error);
      toast.error('Não foi possível acessar o portal de gerenciamento');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

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

  // Verificar parâmetros de URL para status de pagamento
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      console.log('Pagamento concluído com sucesso, verificando status');
      toast.success('Pagamento processado! Atualizando informações da assinatura...');
      checkSubscriptionStatus();
      
      // Limpar parâmetros da URL após processamento
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      }
    } else if (canceled === 'true') {
      console.log('Pagamento cancelado pelo usuário');
      toast.info('O processo de pagamento foi cancelado');
      
      // Limpar parâmetros da URL após processamento
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      }
    }
  }, [checkSubscriptionStatus]);

  return {
    subscription,
    loading,
    checkingOut,
    isPro,
    upgradeToPro,
    downgradeToFree,
    checkSubscriptionStatus,
    manageSubscription
  };
}
