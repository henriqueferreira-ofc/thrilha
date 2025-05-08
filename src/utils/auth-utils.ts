
/**
 * Utility functions for auth-related operations
 */

import { supabase } from '../supabase/client';

/**
 * Clears all authentication data from localStorage, sessionStorage, and cookies
 */
export const clearAuthData = () => {
  console.log('Limpando todos os dados de autenticação');
  
  try {
    // Limpar localStorage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    localStorage.removeItem('sb-yieihrvcbshzmxieflsv-auth-token');
    localStorage.removeItem('supabase.auth.expires_at');
    localStorage.removeItem('supabase.auth.provider_token');
    
    // Limpar cookies relacionados à autenticação
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=').map(c => c.trim());
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    console.log('Dados de autenticação limpos com sucesso');
  } catch (error) {
    console.error('Erro ao limpar dados de autenticação:', error);
  }
};

/**
 * Verificar se o usuário está autenticado
 */
export const checkAuthentication = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    console.error('Exceção ao verificar autenticação:', error);
    return false;
  }
};
