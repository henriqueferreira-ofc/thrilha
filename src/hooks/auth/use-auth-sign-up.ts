
import { useState } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { clearAuthData } from '../../utils/auth';

export function useAuthSignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

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
        // After successful signup, we'll need to sign in the user
        // This will be handled by the calling component
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

  return {
    signUp,
    isLoading,
    lastError
  };
}
