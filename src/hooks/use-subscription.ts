
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SubscriptionPlan } from '@/types/board';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      try {
        setLoading(true);
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

  // Atualizar plano para Pro (simulação - em produção, integração com gateway de pagamento)
  const upgradeToPro = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar seu plano');
      return false;
    }

    try {
      // Em produção, aqui teria a integração com o gateway de pagamento
      // Por enquanto, apenas simulamos a atualização do plano
      
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_type: 'pro',
          status: 'active',
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Parabéns! Você agora é um usuário Pro!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar para o plano Pro');
      return false;
    }
  };

  // Downgrade para o plano gratuito
  const downgradeToFree = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar seu plano');
      return false;
    }

    try {
      // Verificar número de quadros ativos
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_archived', false);
      
      if (boardsError) throw boardsError;
      
      // Verificar se tem mais de 3 quadros
      if (boardsData && boardsData.length > 3) {
        toast.error('Você precisa arquivar alguns quadros antes de fazer downgrade. O plano gratuito permite apenas 3 quadros ativos.');
        return false;
      }

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_type: 'free',
          status: 'active',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Seu plano foi alterado para o gratuito');
      return true;
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      toast.error('Erro ao alterar para o plano gratuito');
      return false;
    }
  };

  return {
    subscription,
    loading,
    isPro: subscription?.plan_type === 'pro',
    upgradeToPro,
    downgradeToFree
  };
}
