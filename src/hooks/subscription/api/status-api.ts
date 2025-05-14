
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
