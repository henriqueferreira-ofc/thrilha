
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

// Criar sessão de checkout do Stripe
export async function createCheckoutSessionAPI(): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    console.log("Iniciando criação de sessão de checkout");
    
    // Obter a origem para redirecionamento após o checkout
    const origin = window.location.origin;
    console.log(`URL de origem para redirecionamento: ${origin}`);
    
    // Invocar a função edge para criar uma sessão de checkout
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { 
        returnUrl: `${origin}/subscription?success=true` 
      }
    });
    
    if (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      toast.error(`Erro ao criar sessão de checkout: ${error.message || 'Erro desconhecido'}`);
      return { success: false, error: error.message || 'Erro desconhecido' };
    }
    
    if (!data?.url) {
      console.error("Resposta sem URL de checkout:", data);
      toast.error('Resposta inválida do servidor de checkout');
      return { success: false, error: 'Resposta inválida do servidor de checkout' };
    }
    
    console.log("URL de checkout criada com sucesso:", data.url);
    console.log("Redirecionando para Stripe Checkout...");
    
    // Para garantir que o redirecionamento funcione corretamente
    window.location.href = data.url;
    
    return { success: true, url: data.url };
  } catch (error) {
    console.error("Erro ao criar URL de checkout:", error);
    toast.error(`Não foi possível acessar o checkout: ${error.message || 'Erro desconhecido'}`);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}
