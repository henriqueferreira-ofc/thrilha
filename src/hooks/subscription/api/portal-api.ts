
import { toast } from '@/hooks/toast';
import { supabase } from '@/supabase/client';

// Criar sessão do portal do cliente para gerenciar assinatura
export async function createCustomerPortalSessionAPI(): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    console.log("Iniciando criação da sessão do portal do cliente Stripe");
    
    // Chamar a função Edge do Supabase para criar a sessão do portal do cliente Stripe
    // Removendo cabeçalhos problemáticos
    const { data, error } = await supabase.functions.invoke("customer-portal");
    
    if (error) {
      const errorMessage = error.message || 'Erro desconhecido';
      console.error('Erro ao criar sessão do portal do cliente:', errorMessage, error);
      
      if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      } else if (errorMessage.includes('cliente')) {
        toast.error('Você não possui uma assinatura ativa. Faça upgrade para o plano Pro primeiro.');
      } else if (errorMessage.includes('Failed to send')) {
        toast.error('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
      } else {
        toast.error('Ocorreu um erro ao acessar o portal do cliente. Por favor, tente novamente.');
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
    
    if (data && data.url) {
      console.log("URL do portal do cliente gerada com sucesso:", data.url);
      return { 
        success: true,
        url: data.url 
      };
    } else if (data && data.error) {
      // Caso a função retorne erro no objeto data
      console.error("Erro retornado pela função:", data.error, data.details || '');
      toast.error('Erro ao processar o acesso ao portal: ' + data.error);
      return {
        success: false,
        error: data.error
      };
    } else {
      const message = 'URL do portal do cliente não retornada pelo servidor';
      console.error(message);
      toast.error('Erro ao acessar o portal do cliente. Por favor, tente novamente em alguns minutos.');
      return { 
        success: false,
        error: message
      };
    }
  } catch (error) {
    const errorMessage = error.message || 'Erro desconhecido';
    console.error('Erro ao acessar portal do cliente:', errorMessage, error);
    toast.error('Não foi possível conectar ao serviço de gerenciamento. Tente novamente mais tarde.');
    return { 
      success: false,
      error: errorMessage
    };
  }
}
