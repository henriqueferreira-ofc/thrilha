
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

// API functions
import { 
  createCheckoutSessionAPI, 
  createCustomerPortalSessionAPI 
} from './api';

/**
 * Hook para gerenciar operações de checkout e portal de gerenciamento de assinaturas
 */
export function useSubscriptionCheckout() {
  const [checkingOut, setCheckingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  /**
   * Upgrade para plano Pro
   */
  const upgradeToPro = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para assinar o plano Pro');
      navigate('/auth');
      return false;
    }
    
    try {
      setCheckingOut(true);
      console.log('Iniciando checkout para plano Pro');
      
      const { success, url, error } = await createCheckoutSessionAPI();
      
      if (!success || !url) {
        console.error('Erro no checkout:', error);
        toast.error(`Erro ao iniciar checkout: ${error || 'Falha na comunicação'}`);
        return false;
      }

      console.log('Redirecionando para URL de checkout:', url);
      // URL já é aberta diretamente no createCheckoutSessionAPI
      // Não precisamos fazer nada aqui, só retornar success
    
      return true;
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      toast.error('Não foi possível iniciar o processo de assinatura');
      return false;
    } finally {
      // Não definimos setCheckingOut(false) aqui pois estaremos redirecionando
    }
  }, [user, navigate]);

  /**
   * Gerenciar assinatura existente via portal do cliente Stripe
   */
  const manageSubscription = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para gerenciar sua assinatura');
      navigate('/auth');
      return false;
    }
    
    try {
      setLoading(true);
      console.log('Acessando portal de gerenciamento da assinatura');
      
      const { success, url, error } = await createCustomerPortalSessionAPI();
      
      if (!success || !url) {
        console.error('Erro ao acessar portal:', error);
        toast.error(`Erro ao acessar portal de gerenciamento: ${error || 'Falha na comunicação'}`);
        return false;
      }

      console.log('Redirecionando para portal de gerenciamento:', url);
      // Usar redirecionamento com window.location para garantir mudança completa de contexto
      window.location.href = url;
      return true;
    } catch (error) {
      console.error('Erro ao gerenciar assinatura:', error);
      toast.error('Não foi possível acessar o portal de gerenciamento');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  /**
   * Downgrade para plano gratuito (usa o mesmo portal de gerenciamento)
   */
  const downgradeToFree = useCallback(async () => {
    return manageSubscription();
  }, [manageSubscription]);

  return {
    checkingOut,
    loading: loading,
    upgradeToPro,
    downgradeToFree,
    manageSubscription
  };
}
