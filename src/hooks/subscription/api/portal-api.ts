
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

// Acessar portal do cliente para gerenciar assinatura
export async function createCustomerPortalSessionAPI(): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    console.log("Iniciando criação de sessão do portal do cliente");
    
    // Chamar a função Edge do Supabase para criar a sessão do portal do cliente
    const { data, error } = await supabase.functions.invoke("customer-portal", {
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    
    if (error) {
      const errorMessage = error.message || 'Erro desconhecido';
      console.error('Erro ao criar sessão do portal:', errorMessage);
      
      if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      } else if (errorMessage.includes('cliente') || errorMessage.includes('customer')) {
        toast.error('Não foi possível encontrar seu perfil de cliente. Você precisa fazer uma assinatura primeiro.');
      } else if (errorMessage.includes('Failed to send')) {
        toast.error('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
      } else {
        toast.error('Ocorreu um erro ao acessar o portal de gerenciamento. Por favor, tente novamente.');
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
    
    if (data && data.url) {
      console.log("URL do portal gerada com sucesso");
      return {
        success: true,
        url: data.url
      };
    } else {
      const message = 'URL do portal não retornada pelo servidor';
      console.error(message);
      toast.error('Erro ao acessar portal de gerenciamento da assinatura. Por favor, tente novamente.');
      return { 
        success: false,
        error: message
      };
    }
  } catch (error) {
    const errorMessage = error.message || 'Erro desconhecido';
    console.error('Erro ao acessar portal de assinatura:', errorMessage);
    toast.error('Não foi possível conectar ao serviço de gerenciamento. Tente novamente mais tarde.');
    return { 
      success: false,
      error: errorMessage
    };
  }
}
