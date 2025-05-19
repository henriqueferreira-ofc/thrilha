
import { useState } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../../utils/auth';

export function useAuthSignOut() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const navigate = useNavigate();

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      console.log('Iniciando processo de logout');
      setIsLoading(true);
      setLastError(null);
      
      // Primeiro limpar o estado local 
      navigate('/', { replace: true });
      
      // Em seguida, fazer logout do Supabase
      await supabase.auth.signOut();
      clearAuthData();
      
      console.log('Logout completo');
      toast.success('Você saiu com sucesso!');
    } catch (error) {
      console.error('Erro durante logout:', error);
      setLastError(error instanceof Error ? error : new Error('Erro desconhecido'));
      // Forçar logout mesmo em caso de erro
      clearAuthData();
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Force logout by clearing all auth data
   */
  const forceLogout = () => {
    console.log('Forçando logout e limpando dados de autenticação');
    clearAuthData();
    window.location.href = '/';
  };

  return {
    signOut,
    forceLogout,
    isLoading,
    lastError
  };
}
