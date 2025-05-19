
/**
 * Utilidades para validação de sessões
 */

import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { clearAuthData, isTokenInvalid } from './token-management';

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
      !isTokenInvalid(data.session.access_token);
    
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
    if (isTokenInvalid(data.session.access_token)) {
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
