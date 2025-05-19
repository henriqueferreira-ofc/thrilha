
import { useSubscriptionStatus } from './use-subscription-status';
import { useSubscriptionCheckout } from './use-subscription-checkout';
import { useSubscriptionUrlHandler } from './use-subscription-url-handler';
import { UseSubscriptionReturn } from './types';

/**
 * Hook combinado para gerenciar assinaturas do usuário
 */
export function useSubscription(): UseSubscriptionReturn {
  // Hook para gerenciar o status da assinatura
  const { 
    subscription, 
    loading: statusLoading, 
    isPro, 
    checkSubscriptionStatus,
    fetchUserSubscription
  } = useSubscriptionStatus();

  // Hook para gerenciar operações de checkout
  const {
    checkingOut,
    loading: checkoutLoading,
    upgradeToPro,
    downgradeToFree,
    manageSubscription
  } = useSubscriptionCheckout();

  // Hook para processar parâmetros de URL relacionados ao checkout
  useSubscriptionUrlHandler({ checkSubscriptionStatus });

  // Combinando todos os hooks
  return {
    subscription,
    loading: statusLoading || checkoutLoading,
    checkingOut,
    isPro,
    upgradeToPro,
    downgradeToFree,
    checkSubscriptionStatus,
    manageSubscription
  };
}
