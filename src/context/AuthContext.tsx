
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, checkAndCreateAvatarsBucket } from '../supabase/client';
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
  updateProfile: (data: { avatar_url?: string }) => Promise<string>;
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
        
        // Verificar e criar bucket se necessário quando o usuário faz login
        if (session?.user) {
          checkAndCreateAvatarsBucket();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
      
      // Verificar e criar bucket se necessário ao iniciar
      if (session?.user) {
        checkAndCreateAvatarsBucket();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Função para garantir que o bucket de avatares existe
  const ensureAvatarBucketExists = async (): Promise<boolean> => {
    return await checkAndCreateAvatarsBucket();
  };

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
      
      // Redirecionar para a página de tarefas após o login bem-sucedido
      navigate('/tasks');
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

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');
    
    // Verificar se o bucket existe antes de continuar
    const bucketExists = await ensureAvatarBucketExists();
    if (!bucketExists) {
      throw new Error('Não foi possível acessar o bucket de avatares');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    console.log('Iniciando upload do avatar:', filePath);
    
    try {
      // Fazer o upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatares') // Nome correto do bucket em português
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      // Verificar se o arquivo foi realmente enviado
      const { data: checkData, error: checkError } = await supabase.storage
        .from('avatares')
        .download(filePath);

      if (checkError || !checkData) {
        console.error('Erro ao verificar arquivo:', checkError);
        throw new Error('Arquivo não encontrado após upload');
      }

      // Obter URL pública do Supabase
      const { data: urlData } = supabase.storage
        .from('avatares')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Não foi possível gerar URL pública');
      }
      
      const publicUrl = urlData.publicUrl;
      console.log('URL pública gerada:', publicUrl);
      
      // Atualizar o perfil com a URL pública
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        throw updateError;
      }
      
      // Adicionar timestamp para evitar problemas de cache
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      return urlWithTimestamp;
    } catch (error) {
      console.error('Erro completo no upload:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { avatar_url?: string }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        throw updateError;
      }

      toast.success('Perfil atualizado com sucesso!');
      return data.avatar_url || '';
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
