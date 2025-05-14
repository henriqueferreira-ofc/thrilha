
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

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
