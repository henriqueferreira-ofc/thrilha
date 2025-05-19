import { useState } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../utils/auth'; // Importação atualizada

export function useAuthService() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const navigate = useNavigate();

  /**
   * Sign up a new user
   */
  const signUp = async (email: string, password: string, username?: string): Promise<void> => {
    try {
      setIsLoading(true);
      setLastError(null);
      console.log(`Iniciando processo de cadastro para: ${email}, username: ${username || 'não fornecido'}`);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username || email.split('@')[0]
          }
        }
      });

      if (error) {
        console.error('Erro no cadastro:', error);
        throw error;
      }
      
      console.log('Resposta do cadastro:', data);
      
      if (data.user) {
        console.log('Usuário cadastrado com ID:', data.user.id);
        // Após cadastro bem-sucedido, vamos autenticar o usuário
        await signIn(email, password);
      } else {
        console.warn('Usuário criado, mas sem dados retornados do Supabase');
        toast.success('Cadastro realizado! Verifique seu email para confirmar sua conta.');
      }
    } catch (error: unknown) {
      console.error('Erro no cadastro:', error);
      setLastError(error instanceof Error ? error : new Error('Erro desconhecido'));
      
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
        } else {
          toast.error(`Erro ao criar conta: ${error.message}`);
        }
      } else {
        toast.error('Erro desconhecido ao criar conta');
      }
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
      setLastError(null);
      console.log('Iniciando processo de login para:', email);
      
      // Limpar qualquer sessão residual antes de iniciar um novo login
      clearAuthData();
      
      // Verificar se há tokens antigos no localStorage e remover
      const localStorageKeys = Object.keys(localStorage);
      const supabaseKeys = localStorageKeys.filter(key => 
        key.includes('supabase') || key.includes('sb-')
      );
      
      if (supabaseKeys.length > 0) {
        console.log('Encontrados tokens antigos no localStorage:', supabaseKeys);
        supabaseKeys.forEach(key => localStorage.removeItem(key));
      }
      
      console.log('Autenticando com email e senha...');
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
        console.error('Sessão não criada após login bem-sucedido');
        throw new Error('Sessão de autenticação não criada');
      }
      
      console.log('Usuário autenticado:', data.user?.id);
      console.log('Sessão expira em:', new Date(data.session.expires_at! * 1000).toLocaleString());
      
      // Redirecionar para tarefas imediatamente, sem delay
      console.log('Redirecionando para /tasks após login');
      navigate('/tasks', { replace: true });
    } catch (error: unknown) {
      console.error('Erro capturado durante login:', error);
      setLastError(error instanceof Error ? error : new Error('Erro desconhecido'));
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          toast.error(`Erro ao fazer login: ${error.message}`);
        }
      } else {
        toast.error('Erro desconhecido ao fazer login');
      }
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

  /**
   * Reset password link
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      setLastError(null);
      console.log('Enviando link de redefinição de senha para:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) throw error;
      
      toast.success('Link de redefinição de senha enviado para seu email!');
    } catch (error) {
      console.error('Erro ao enviar link de redefinição:', error);
      setLastError(error instanceof Error ? error : new Error('Erro desconhecido'));
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar link de redefinição');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    forceLogout,
    isLoading,
    lastError
  };
}
