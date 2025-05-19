
/**
 * Utilidades para gerenciamento de tokens de autenticação
 */

import { toast } from 'sonner';

// Token blacklist para manter tokens inválidos após logout forçado
const invalidatedTokens = new Set<string>();

/**
 * Limpa todos os dados de autenticação de localStorage, sessionStorage e cookies
 * e adiciona o token atual à blacklist se existir
 */
export const clearAuthData = () => {
  console.log('Limpando todos os dados de autenticação');
  
  try {
    // Lista de chaves específicas do Supabase para remover
    const supabaseKeys = [
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'sb-yieihrvcbshzmxieflsv-auth-token',
      'supabase.auth.expires_at',
      'supabase.auth.provider_token'
    ];
    
    // Limpar localStorage - chaves específicas
    supabaseKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`Removendo ${key} do localStorage`);
        localStorage.removeItem(key);
      }
    });
    
    // Procurar por outras chaves do Supabase que possam existir
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        console.log(`Removendo ${key} do localStorage`);
        localStorage.removeItem(key);
      }
    }
    
    // Limpar cookies relacionados à autenticação com flags de segurança
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=').map(c => c.trim());
      if (name.includes('supabase') || name.includes('sb-')) {
        console.log(`Removendo cookie: ${name}`);
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;`;
      }
    });
    
    // Limpar sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        console.log(`Removendo ${key} do sessionStorage`);
        sessionStorage.removeItem(key);
      }
    }
    
    console.log('Dados de autenticação limpos com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados de autenticação:', error);
    return false;
  }
};

/**
 * Adiciona um token à lista de tokens invalidados
 */
export const invalidateToken = (token: string) => {
  if (token) {
    invalidatedTokens.add(token);
    return true;
  }
  return false;
};

/**
 * Verifica se um token está na blacklist
 */
export const isTokenInvalid = (token: string | undefined): boolean => {
  return token ? invalidatedTokens.has(token) : false;
};

