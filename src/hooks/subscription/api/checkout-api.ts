
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

// Criar sessão de checkout do Stripe
export async function createCheckoutSessionAPI(): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    console.log("Iniciando criação da sessão de checkout do Stripe");
    
    // Chamar a função Edge do Supabase para criar a sessão de checkout do Stripe
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    
    if (error) {
      const errorMessage = error.message || 'Erro desconhecido';
      console.error('Erro ao criar sessão de checkout:', errorMessage, error);
      
      if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      } else if (errorMessage.includes('customer')) {
        toast.error('Não foi possível criar seu perfil de cliente. Tente novamente em alguns minutos.');
      } else if (errorMessage.includes('Failed to send')) {
        toast.error('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
      } else if (errorMessage.includes('STRIPE_SECRET_KEY')) {
        toast.error('Configuração do sistema incompleta. Por favor, contate o suporte.');
        console.error('A chave do Stripe não está configurada no servidor.');
      } else {
        toast.error('Ocorreu um erro ao iniciar o processo de upgrade. Por favor, tente novamente.');
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
    
    if (data && data.url) {
      console.log("URL de checkout gerada com sucesso:", data.url);
      return { 
        success: true,
        url: data.url 
      };
    } else if (data && data.error) {
      // Caso a função retorne erro no objeto data
      console.error("Erro retornado pela função:", data.error, data.details || '');
      toast.error('Erro ao processar o checkout: ' + data.error);
      return {
        success: false,
        error: data.error
      };
    } else {
      const message = 'URL de checkout não retornada pelo servidor';
      console.error(message);
      toast.error('Erro ao iniciar o processo de upgrade. Por favor, tente novamente em alguns minutos.');
      return { 
        success: false,
        error: message
      };
    }
  } catch (error) {
    const errorMessage = error.message || 'Erro desconhecido';
    console.error('Erro ao atualizar plano:', errorMessage, error);
    toast.error('Não foi possível conectar ao serviço de pagamento. Tente novamente mais tarde.');
    return { 
      success: false,
      error: errorMessage
    };
  }
}
