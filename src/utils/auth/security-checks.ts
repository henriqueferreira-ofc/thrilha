
/**
 * Verificações de segurança para autenticação
 */

import { toast } from 'sonner';

/**
 * Verifica se há tentativas de ataque de clickjacking
 * e outros ataques baseados em frame
 */
export const checkSecurityViolations = (): boolean => {
  try {
    // Verificar se está sendo carregado em um iframe
    if (window.self !== window.top) {
      console.error('Aplicação carregada em um iframe - possível tentativa de clickjacking');
      toast.error('Violação de segurança detectada');
      return false;
    }
    
    // Verificar se referrer é seguro
    if (document.referrer) {
      const referrer = new URL(document.referrer);
      const allowedDomains = [
        'localhost',
        'yieihrvcbshzmxieflsv.supabase.co',
        window.location.hostname
      ];
      
      if (!allowedDomains.some(domain => referrer.hostname.includes(domain))) {
        console.warn('Referrer suspeito detectado:', document.referrer);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar violações de segurança:', error);
    return false;
  }
};
