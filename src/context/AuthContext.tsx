import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { ErrorType } from '@/types/common';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { avatar_url?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Primeiro configurar o listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Depois verificar se já existe uma sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Limpar o subscriber quando o componente for desmontado
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
      // Limpar o estado antes de fazer logout para evitar problemas
      setUser(null);
      setSession(null);
      
      // Usar opções específicas para evitar o erro 403
      const { error } = await supabase.auth.signOut({
        scope: 'local' // Usar 'local' em vez de 'global' para evitar o erro 403
      });
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }
      
      // Limpar qualquer dado local
      localStorage.removeItem('supabase.auth.token');
      
      toast.success('Logout realizado com sucesso!');
      
      // Redirecionamento opcional para a página inicial
      window.location.href = '/';
    } catch (error: unknown) {
      console.error('Erro detalhado ao fazer logout:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer logout');
      
      // Mesmo com erro, redefinir o estado para garantir logout no lado do cliente
      setUser(null);
      setSession(null);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      // Validar o tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione uma imagem válida');
      }

      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 2MB');
      }

      // Gerar nome de arquivo único
      const fileExt = file.name.split('.').pop();
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const fileName = `${user.id}_${Date.now()}_${uniqueId}.${fileExt}`;

      console.log('Iniciando upload do avatar:', fileName);

      // Verificar se o bucket existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Erro ao verificar buckets:', bucketsError);
        throw bucketsError;
      }
      
      if (!buckets.some(b => b.name === 'avatars')) {
        console.error('O bucket "avatars" não existe');
        throw new Error('Bucket de avatares não encontrado');
      }

      // Upload do arquivo com retry
      let uploadError = null;
      let uploadAttempt = 0;
      const maxAttempts = 3;
      
      while (uploadAttempt < maxAttempts) {
        uploadAttempt++;
        console.log(`Tentativa de upload ${uploadAttempt}/${maxAttempts}`);
        
        const { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: 'no-cache',
            upsert: true
          });
          
        if (!error) {
          uploadError = null;
          break;
        }
        
        uploadError = error;
        
        // Esperar antes de tentar novamente
        if (uploadAttempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (uploadError) {
        console.error('Falha no upload após múltiplas tentativas:', uploadError);
        throw uploadError;
      }

      console.log('Upload concluído com sucesso, obtendo URL pública');

      // Obter URL pública com parâmetro de timestamp para evitar cache
      const timestamp = new Date().getTime();
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Adicionar timestamp à URL para evitar cache
      const urlWithTimestamp = `${publicUrl}?t=${timestamp}`;
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

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: unknown) {
      toast.error('Erro ao atualizar perfil');
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
