
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

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
