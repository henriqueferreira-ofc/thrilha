/**
 * Utility functions for auth-related operations
 */

import { supabase } from '../supabase/client';
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
    // Tentar obter o token atual antes de limpar para adicionar à blacklist
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        invalidatedTokens.add(data.session.access_token);
      }
    };
    
    getSession();
    
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
 * Verificar se o usuário está autenticado e se o token é válido
 */
export const checkAuthentication = async () => {
  try {
    console.log('Verificando autenticação');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
    
    // Verificar se a sessão existe e o token não está na blacklist
    const isAuthenticated = !!data.session && 
      !invalidatedTokens.has(data.session.access_token);
    
    console.log('Status de autenticação:', isAuthenticated ? 'Autenticado' : 'Não autenticado');
    
    if (isAuthenticated) {
      console.log('Usuário autenticado:', data.session?.user.id);
      
      // Verificar se o token está prestes a expirar (menos de 5 minutos)
      const expiresAt = data.session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60;
      
      if (expiresAt && (expiresAt - now < fiveMinutes)) {
        console.log('Token está prestes a expirar, atualizando...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Erro ao atualizar token:', refreshError);
          return false;
        }
        
        console.log('Token atualizado com sucesso');
      } else {
        console.log('Sessão expira em:', new Date((expiresAt || 0) * 1000).toLocaleString());
      }
    }
    
    return isAuthenticated;
  } catch (error) {
    console.error('Exceção ao verificar autenticação:', error);
    return false;
  }
};

/**
 * Verifica a sessão e força logout se não estiver válida
 * Implementa verificações adicionais de segurança
 */
export const validateSession = async (): Promise<boolean> => {
  try {
    console.log('Validando sessão atual');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao validar sessão:', error);
      clearAuthData();
      return false;
    }
    
    if (!data.session) {
      console.warn('Nenhuma sessão encontrada');
      clearAuthData();
      return false;
    }
    
    // Verificar se o token está na blacklist
    if (invalidatedTokens.has(data.session.access_token)) {
      console.warn('Token na blacklist - sessão inválida');
      clearAuthData();
      toast.error('Sua sessão foi invalidada por motivos de segurança');
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
    
    // Verificar tempo restante de sessão
    const remainingTime = expiresAt ? expiresAt - now : 0;
    console.log('Sessão válida até:', new Date(expiresAt! * 1000).toLocaleString());
    console.log('Tempo restante de sessão:', Math.floor(remainingTime / 60), 'minutos');
    
    // Implementar rotação automática de token para sessões longas (mais de 1h restante)
    if (remainingTime > 3600) {
      console.log('Sessão longa detectada, rotacionando token para segurança');
      await supabase.auth.refreshSession();
      console.log('Token rotacionado com sucesso');
    }
    
    return true;
  } catch (error) {
    console.error('Exceção ao validar sessão:', error);
    clearAuthData();
    return false;
  }
};

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
