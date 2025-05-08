
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
      console.error('Erro no cadastro:', error);
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
      
      // Limpar qualquer sessão residual
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Erro de autenticação:', error.message);
        throw error;
      }
      
      console.log('Login realizado com sucesso:', data.session ? 'Sessão válida' : 'Sem sessão');
      
      if (!data.session) {
        throw new Error('Sessão de autenticação não criada');
      }
      
      toast.success('Login realizado com sucesso!');
      
      // Redirecionar para tarefas com um pequeno delay para garantir que 
      // eventos de autenticação sejam processados
      setTimeout(() => {
        console.log('Redirecionando para /tasks após login');
        navigate('/tasks', { replace: true });
      }, 1500);
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
      setIsLoading(true);
      
      // Primeiro limpar o estado local 
      navigate('/', { replace: true });
      
      // Em seguida, fazer logout do Supabase
      await supabase.auth.signOut();
      clearAuthData();
      
      console.log('Logout completo');
      toast.success('Você saiu com sucesso!');
    } catch (error) {
      console.error('Erro durante logout:', error);
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
    signUp,
    signIn,
    signOut,
    forceLogout,
    isLoading
  };
}
