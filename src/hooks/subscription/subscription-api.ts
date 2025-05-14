
import { toast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/board';
import { supabase } from '@/supabase/client';

// Verificar status da assinatura com Stripe
export async function checkSubscriptionStatusAPI(userId: string): Promise<{success: boolean, data?: any}> {
  if (!userId) {
    toast.error('Você precisa estar logado para verificar seu plano');
    return { success: false };
  }

  try {
    const { data, error } = await supabase.functions.invoke("check-subscription");
    
    if (error) throw error;
    
    return { 
      success: true,
      data
    };
  } catch (error) {
    console.error('Erro ao verificar status da assinatura:', error);
    toast.error('Erro ao verificar status da assinatura');
    return { success: false };
  }
}

// Criar sessão de checkout do Stripe
export async function createCheckoutSessionAPI(): Promise<{success: boolean, url?: string}> {
  try {
    // Chamar a função Edge do Supabase para criar a sessão de checkout do Stripe
    const { data, error } = await supabase.functions.invoke("create-checkout");
    
    if (error) throw error;
    
    if (data && data.url) {
      return { 
        success: true,
        url: data.url 
      };
    } else {
      throw new Error('URL de checkout não retornada');
    }
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    toast.error('Erro ao atualizar para o plano Pro');
    return { success: false };
  }
}

// Acessar portal do cliente para gerenciar assinatura
export async function createCustomerPortalSessionAPI(): Promise<{success: boolean, url?: string}> {
  try {
    // Chamar a função Edge do Supabase para criar a sessão do portal do cliente
    const { data, error } = await supabase.functions.invoke("customer-portal");
    
    if (error) throw error;
    
    if (data && data.url) {
      return {
        success: true,
        url: data.url
      };
    } else {
      throw new Error('URL do portal não retornada');
    }
  } catch (error) {
    console.error('Erro ao acessar portal de assinatura:', error);
    toast.error('Erro ao acessar portal de gerenciamento da assinatura');
    return { success: false };
  }
}

// Buscar dados da assinatura do usuário
export async function fetchUserSubscriptionAPI(userId: string): Promise<{data: SubscriptionPlan | null, error: any | null}> {
  try {
    // Buscar dados da assinatura do Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Configurar listener para atualizações em tempo real
export function setupSubscriptionListener(userId: string, onUpdate: (data: SubscriptionPlan) => void, onDelete: () => void) {
  return supabase
    .channel('public:subscriptions')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public',
      table: 'subscriptions',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('Alteração em assinatura recebida:', payload);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        onUpdate(payload.new as SubscriptionPlan);
      } else if (payload.eventType === 'DELETE') {
        onDelete();
      }
    })
    .subscribe();
}
