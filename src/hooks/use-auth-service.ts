
import { useState } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
      console.log('Iniciando processo de login para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Erro de autenticação:', error.message);
        throw error;
      }
      
      console.log('Login realizado com sucesso:', data.session ? 'Sessão válida' : 'Sem sessão');
      toast.success('Login realizado com sucesso!');
      
      // Aumentar o timeout para garantir que o estado de autenticação seja atualizado
      setTimeout(() => {
        console.log('Redirecionando para /tasks');
        navigate('/tasks', { replace: true });
      }, 1000); // Aumentado para 1s para dar mais tempo para o estado ser atualizado
    } catch (error: unknown) {
      console.error('Erro capturado durante login:', error);
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
      console.log('Iniciando processo de logout');
      // Primeiro limpar o estado local e redirecionar
      navigate('/', { replace: true });
      setTimeout(async () => {
        try {
          await supabase.auth.signOut();
          clearAuthData();
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
