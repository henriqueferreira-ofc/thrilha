
import { useState } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';

export function useAuthPasswordReset() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

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
    resetPassword,
    isLoading,
    lastError
  };
}
