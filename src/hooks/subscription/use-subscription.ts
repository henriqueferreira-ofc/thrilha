
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/board';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase/client';
import { 
  checkSubscriptionStatusAPI, 
  createCheckoutSessionAPI, 
  createCustomerPortalSessionAPI,
  fetchUserSubscriptionAPI,
  setupSubscriptionListener
} from './api';
import { UseSubscriptionReturn } from './types';

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await fetchUserSubscriptionAPI(user.id);

        if (error) {
          console.error('Erro ao buscar assinatura:', error);
          toast.error('Erro ao carregar informações da sua assinatura');
        } else {
          setSubscription(data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();

    // Configurar listener para atualizações em tempo real
    const subscriptionChannel = setupSubscriptionListener(
      user.id,
      (newData) => setSubscription(newData),
      () => setSubscription(null)
    );

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [user]);

  // Verificar status da assinatura com Stripe
  const checkSubscriptionStatus = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para verificar seu plano');
      return false;
    }

    try {
      setLoading(true);
      
      const result = await checkSubscriptionStatusAPI(user.id);
      
      if (result.success && result.data?.subscription) {
        // Atualizar o estado local com os dados mais recentes
        setSubscription(prev => {
          if (!prev || prev.plan_type !== result.data.plan_type) {
            return {
              ...prev,
              id: prev?.id || '',
              user_id: user.id,
              plan_type: result.data.plan_type,
              status: 'active',
              start_date: prev?.start_date || new Date().toISOString(),
              end_date: result.data.end_date,
              created_at: prev?.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          return prev;
        });
      }
      
      return result.success;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar plano para Pro usando Stripe
  const upgradeToPro = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar seu plano');
      return false;
    }

    try {
      setCheckingOut(true);
      
      const result = await createCheckoutSessionAPI();
      
      if (result.success && result.url) {
        // Redirecionar para o checkout do Stripe
        window.location.href = result.url;
        return true;
      }
      
      return false;
    } finally {
      setCheckingOut(false);
    }
  };

  // Acessar portal do cliente para gerenciar assinatura
  const manageSubscription = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para gerenciar sua assinatura');
      return false;
    }

    try {
      setLoading(true);
      
      const result = await createCustomerPortalSessionAPI();
      
      if (result.success && result.url) {
        // Redirecionar para o portal do cliente Stripe
        window.location.href = result.url;
        return true;
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Downgrade para o plano gratuito (agora feito via portal do cliente)
  const downgradeToFree = async (): Promise<boolean> => {
    return manageSubscription();
  };

  // Verificar se é plano pro ou já está no checkout
  const isPro = subscription?.plan_type === 'pro';
  const isCheckingOut = checkingOut;

  // Checar status em casos específicos (primeira carga, após checkout, etc)
  useEffect(() => {
    if (user) {
      // Verificar parâmetros de URL para sucesso ou cancelamento do checkout
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const canceled = urlParams.get('canceled');
      
      if (success === 'true' || canceled === 'true') {
        // Limpar parâmetros da URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Verificar status da assinatura
        checkSubscriptionStatus();
        
        // Mostrar mensagem apropriada
        if (success === 'true') {
          toast.success('Assinatura Pro ativada com sucesso!');
        } else if (canceled === 'true') {
          toast.info('Processo de checkout cancelado');
        }
      }
    }
  }, [user]);

  return {
    subscription,
    loading,
    checkingOut: isCheckingOut,
    isPro,
    upgradeToPro,
    downgradeToFree,
    checkSubscriptionStatus,
    manageSubscription
  };
}
