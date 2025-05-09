import { useState, useEffect } from 'react';
import { supabase, checkBucketExists } from '../supabase/client';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        setUser(session?.user ?? null);
        
        // Verificar se o bucket existe
        if (session?.user) {
          await checkBucketExists();
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
        setError(err instanceof Error ? err : new Error('Erro ao verificar sessão'));
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError(err instanceof Error ? err : new Error('Erro ao fazer login'));
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Erro ao criar conta:', err);
      setError(err instanceof Error ? err : new Error('Erro ao criar conta'));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError(err instanceof Error ? err : new Error('Erro ao fazer logout'));
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut
  };
}
