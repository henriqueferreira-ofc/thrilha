
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

// Criar sessão do portal do cliente Stripe para gerenciar assinatura
export async function createCustomerPortalSessionAPI(): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    console.log("Iniciando criação de sessão do portal do cliente");
    
    // Obter a origem para redirecionamento após o gerenciamento
    const origin = window.location.origin;
    const returnPath = '/subscription';
    console.log(`URL de retorno para o portal: ${origin}${returnPath}`);
    
    // Invocar a função edge para criar portal do cliente
    const { data, error } = await supabase.functions.invoke("customer-portal", {
      body: { 
        returnUrl: `${origin}${returnPath}` 
      }
    });
    
    if (error) {
      console.error("Erro ao acessar portal do cliente:", error);
      toast.error(`Erro ao acessar portal de gerenciamento: ${error.message || 'Erro desconhecido'}`);
      return { success: false, error: error.message || 'Erro desconhecido' };
    }
    
    if (!data?.url) {
      console.error("Resposta sem URL do portal:", data);
      toast.error('Resposta inválida do servidor');
      return { success: false, error: 'Resposta inválida do servidor' };
    }
    
    console.log("URL do portal criada com sucesso:", data.url);
    return { success: true, url: data.url };
  } catch (error) {
    console.error("Erro ao criar URL do portal:", error);
    toast.error(`Não foi possível acessar o portal: ${error.message || 'Erro desconhecido'}`);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}
