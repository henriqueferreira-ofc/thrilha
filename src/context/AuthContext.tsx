import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { ErrorType } from '@/types/common';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { avatar_url?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  forceLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearAuthData = () => {
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('supabase.auth.refreshToken');
  localStorage.removeItem('sb-yieihrvcbshzmxieflsv-auth-token');
  
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=').map(c => c.trim());
    if (name.includes('supabase') || name.includes('sb-')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
  
  sessionStorage.clear();
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const forceLogout = () => {
    setUser(null);
    setSession(null);
    clearAuthData();
    window.location.href = '/';
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string): Promise<void> => {
    try {
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
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Login realizado com sucesso!');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      navigate('/', { replace: true });
      setTimeout(async () => {
        try {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          console.log('User signed out successfully');
        } catch (error) {
          console.error('Error signing out:', error);
          setUser(null);
          setSession(null);
        }
      }, 100);
    } catch (error) {
      console.error('Error during sign out:', error);
      window.location.href = '/';
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione uma imagem válida');
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 2MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Iniciando upload do avatar:', filePath);

      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error('Erro ao verificar buckets:', bucketsError);
          throw bucketsError;
        }
        
        if (!buckets.some(b => b.name === 'avatares')) {
          console.log('Bucket avatares não encontrado, tentando criar...');
          const { error: createBucketError } = await supabase.storage.createBucket('avatares', { 
            public: true,
            fileSizeLimit: 3145728
          });
          
          if (createBucketError) {
            console.error('Erro ao criar bucket:', createBucketError);
            throw new Error('Não foi possível criar o bucket de avatares');
          }
        }
      } catch (bucketCheckError) {
        console.error('Erro ao verificar/criar bucket:', bucketCheckError);
      }

      let uploadError = null;
      let uploadAttempt = 0;
      const maxAttempts = 3;
      
      while (uploadAttempt < maxAttempts) {
        uploadAttempt++;
        console.log(`Tentativa de upload ${uploadAttempt}/${maxAttempts}`);
        
        const { error } = await supabase.storage
          .from('avatares')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (!error) {
          uploadError = null;
          break;
        }
        
        uploadError = error;
        console.error(`Erro na tentativa ${uploadAttempt}:`, error);
        
        if (uploadAttempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (uploadError) {
        console.error('Falha no upload após múltiplas tentativas:', uploadError);
        throw uploadError;
      }

      console.log('Upload concluído com sucesso, obtendo URL pública');

      const timestamp = new Date().getTime();
      const { data: publicURLData } = supabase.storage
        .from('avatares')
        .getPublicUrl(filePath);

      if (!publicURLData || !publicURLData.publicUrl) {
        throw new Error('Erro ao gerar URL pública para o avatar');
      }

      const urlWithTimestamp = `${publicURLData.publicUrl}?t=${timestamp}`;
      console.log('URL pública gerada:', urlWithTimestamp);

      return urlWithTimestamp;
    } catch (error: unknown) {
      console.error('Erro detalhado ao fazer upload da imagem:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
      throw error;
    }
  };

  const updateProfile = async (data: { avatar_url?: string }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao verificar perfil:', fetchError);
        throw fetchError;
      }
      
      let operation;
      
      if (existingProfile) {
        operation = supabase
          .from('profiles')
          .update({
            avatar_url: data.avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } else {
        operation = supabase
          .from('profiles')
          .insert({
            id: user.id,
            avatar_url: data.avatar_url,
            username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
            updated_at: new Date().toISOString(),
          });
      }
      
      const { error: updateError } = await operation;
      
      if (updateError) {
        console.error('Erro ao atualizar/criar perfil:', updateError);
        throw updateError;
      }

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: unknown) {
      console.error('Erro completo ao atualizar perfil:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    uploadAvatar,
    forceLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function isAuthenticated(): boolean {
  return !!supabase.auth.getUser() || !!localStorage.getItem('supabase.auth.token');
}
