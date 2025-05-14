
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/board';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        
        // Buscar dados da assinatura do Supabase
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setSubscription(data);
      } catch (error) {
        console.error('Erro ao buscar assinatura:', error);
        toast.error('Erro ao carregar informações da sua assinatura');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();

    // Configurar listener para atualizações em tempo real
    const subscriptionSubscription = supabase
      .channel('public:subscriptions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Alteração em assinatura recebida:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setSubscription(payload.new as SubscriptionPlan);
        } else if (payload.eventType === 'DELETE') {
          setSubscription(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionSubscription);
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
      
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      
      // Atualizar o estado local com os dados mais recentes
      if (data.subscription) {
        // Não precisamos atualizar o Supabase aqui, a função Edge já fez isso
        setSubscription(prev => {
          if (!prev || prev.plan_type !== data.plan_type) {
            return {
              ...prev,
              id: prev?.id || '',
              user_id: user.id,
              plan_type: data.plan_type,
              status: 'active',
              start_date: prev?.start_date || new Date().toISOString(),
              end_date: data.end_date,
              created_at: prev?.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          return prev;
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
      toast.error('Erro ao verificar status da assinatura');
      return false;
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
      
      // Chamar a função Edge do Supabase para criar a sessão de checkout do Stripe
      const { data, error } = await supabase.functions.invoke("create-checkout");
      
      if (error) throw error;
      
      if (data && data.url) {
        // Redirecionar para o checkout do Stripe
        window.location.href = data.url;
        return true;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar para o plano Pro');
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
      
      // Chamar a função Edge do Supabase para criar a sessão do portal do cliente
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data && data.url) {
        // Redirecionar para o portal do cliente Stripe
        window.location.href = data.url;
        return true;
      } else {
        throw new Error('URL do portal não retornada');
      }
    } catch (error) {
      console.error('Erro ao acessar portal de assinatura:', error);
      toast.error('Erro ao acessar portal de gerenciamento da assinatura');
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
