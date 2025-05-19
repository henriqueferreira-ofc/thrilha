
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

type UseSubscriptionUrlHandlerProps = {
  checkSubscriptionStatus: () => Promise<boolean>;
};

/**
 * Hook para processar parâmetros de URL relacionados ao checkout
 */
export function useSubscriptionUrlHandler({
  checkSubscriptionStatus
}: UseSubscriptionUrlHandlerProps) {
  // Verificar parâmetros de URL para status de pagamento
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      console.log('Pagamento concluído com sucesso, verificando status');
      toast.success('Pagamento processado! Atualizando informações da assinatura...');
      checkSubscriptionStatus();
      
      // Limpar parâmetros da URL após processamento
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      }
    } else if (canceled === 'true') {
      console.log('Pagamento cancelado pelo usuário');
      toast.info('O processo de pagamento foi cancelado');
      
      // Limpar parâmetros da URL após processamento
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      }
    }
  }, [checkSubscriptionStatus]);

  return {};
}
