
import { useState } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { checkAndCreateAvatarsBucket } from '../supabase/client';
import { clearAuthData } from '../utils/auth-utils';

export function useAuthService() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * Sign up a new user
   */
  const signUp = async (email: string, password: string, username?: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username || email.split('@')[0]
          }
        }
      });

      if (error) throw error;
      toast.success('Cadastro realizado! Verifique seu email para confirmar sua conta.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in an existing user
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Login realizado com sucesso!');
      
      // Redirecionar para a página de tarefas após o login bem-sucedido
      navigate('/tasks');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      navigate('/', { replace: true });
      setTimeout(async () => {
        try {
          await supabase.auth.signOut();
          console.log('User signed out successfully');
        } catch (error) {
          console.error('Error signing out:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Error during sign out:', error);
      window.location.href = '/';
    }
  };

  /**
   * Force logout by clearing all auth data
   */
  const forceLogout = () => {
    clearAuthData();
    window.location.href = '/';
  };

  return {
    signUp,
    signIn,
    signOut,
    forceLogout,
    isLoading
  };
}
