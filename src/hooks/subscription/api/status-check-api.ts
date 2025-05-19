
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

/**
 * Verificar status da assinatura com Stripe
 * @param userId ID do usuário para verificar assinatura
 * @returns Objeto com status da operação e dados da assinatura quando bem-sucedida
 */
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
