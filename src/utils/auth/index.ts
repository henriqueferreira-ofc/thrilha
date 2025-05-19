
/**
 * Exporta todas as funções de autenticação para facilitar a importação
 */

export * from './token-management';
export * from './session-validation';
export * from './security-checks';

// Para manter compatibilidade com importações existentes
import { clearAuthData } from './token-management';
import { checkAuthentication, validateSession } from './session-validation';
import { checkSecurityViolations } from './security-checks';

export {
  clearAuthData,
  checkAuthentication,
  validateSession,
  checkSecurityViolations
};
