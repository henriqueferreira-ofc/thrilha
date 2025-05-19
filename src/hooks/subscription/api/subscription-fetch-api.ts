
import { SubscriptionPlan } from '@/types/board';
import { supabase } from '@/supabase/client';

/**
 * Buscar dados da assinatura do usuário do banco de dados
 * @param userId ID do usuário para buscar dados da assinatura
 * @returns Objeto com dados da assinatura ou erro se houver falha
 */
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
