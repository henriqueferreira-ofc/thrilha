
import { useState } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../../utils/auth';

export function useAuthSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const navigate = useNavigate();

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

  return {
    signIn,
    isLoading,
    lastError
  };
}
