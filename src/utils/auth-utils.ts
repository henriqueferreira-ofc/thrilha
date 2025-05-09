
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
    
    // Limpar cookies relacionados à autenticação
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=').map(c => c.trim());
      if (name.includes('supabase') || name.includes('sb-')) {
        console.log(`Removendo cookie: ${name}`);
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
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
 * Verificar se o usuário está autenticado
 */
export const checkAuthentication = async () => {
  try {
    console.log('Verificando autenticação');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
    
    const isAuthenticated = !!data.session;
    console.log('Status de autenticação:', isAuthenticated ? 'Autenticado' : 'Não autenticado');
    
    if (isAuthenticated) {
      console.log('Usuário autenticado:', data.session?.user.id);
      console.log('Sessão expira em:', new Date(data.session?.expires_at! * 1000).toLocaleString());
    }
    
    return isAuthenticated;
  } catch (error) {
    console.error('Exceção ao verificar autenticação:', error);
    return false;
  }
};

/**
 * Verifica a sessão e força logout se não estiver válida
 */
export const validateSession = async (): Promise<boolean> => {
  try {
    console.log('Validando sessão atual');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao validar sessão:', error);
      return false;
    }
    
    if (!data.session) {
      console.warn('Nenhuma sessão encontrada');
      clearAuthData();
      return false;
    }
    
    // Verificar se o token está expirado
    const expiresAt = data.session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    if (expiresAt && expiresAt < now) {
      console.warn('Sessão expirada');
      clearAuthData();
      return false;
    }
    
    console.log('Sessão válida até:', new Date(expiresAt! * 1000).toLocaleString());
    return true;
  } catch (error) {
    console.error('Exceção ao validar sessão:', error);
    clearAuthData();
    return false;
  }
};
