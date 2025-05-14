import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { useAuthService } from '../hooks/use-auth-service';
import { useAvatarUpload } from '../hooks/use-avatar-upload';
import { clearAuthData } from '../utils/auth-utils';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { avatar_url?: string }) => Promise<string>;
  uploadAvatar: (file: File) => Promise<string>;
  forceLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = useAuthService();
  const avatarService = useAvatarUpload(user);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Limpar qualquer estado de autenticação residual
  useEffect(() => {
    console.log('AuthProvider - Verificando se há tokens antigos para limpar');
    
    // Se houver um token no localStorage mas não na sessão Supabase,
    // pode haver um problema de sincronização
    if (localStorage.getItem('supabase.auth.token') && !session) {
      console.log('Token encontrado no localStorage mas sem sessão ativa, limpando');
      clearAuthData();
    }
  }, [session]);

  // Initialize authentication state
  useEffect(() => {
    console.log('AuthProvider - Inicializando estado de autenticação');
    let mounted = true;
    
    // Primeiro configurar o listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('AuthProvider - Evento de autenticação:', event, 'Sessão:', currentSession ? 'Presente' : 'Ausente');
        
        if (mounted) {
          if (currentSession) {
            console.log('Sessão válida detectada, atualizando estado');
            console.log('ID do usuário:', currentSession.user.id);
            console.log('Sessão expira em:', new Date(currentSession.expires_at! * 1000).toLocaleString());
          } else {
            console.log('Nenhuma sessão válida detectada');
          }
          
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setLoading(false);
          setAuthInitialized(true);
          
          if (event === 'SIGNED_OUT') {
            toast.info('Você saiu do sistema');
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token atualizado com sucesso');
          } else if (event === 'USER_UPDATED') {
            console.log('Dados do usuário atualizados');
            toast.info('Perfil atualizado');
          }
        }
      }
    );

    // Em seguida, verificar a sessão atual
    const checkSession = async () => {
      try {
        console.log('Verificando sessão atual...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          throw error;
        }
        
        if (data.session) {
          console.log('Sessão existente recuperada');
          console.log('ID do usuário:', data.session.user.id);
          console.log('Sessão expira em:', new Date(data.session.expires_at! * 1000).toLocaleString());
        } else {
          console.log('Nenhuma sessão ativa encontrada');
        }
        
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user || null);
          setLoading(false);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('Exceção ao obter sessão:', error);
        if (mounted) {
          setLoading(false);
          setAuthInitialized(true);
          clearAuthData(); // Limpar dados de autenticação em caso de erro
        }
      }
    };
    
    // Usar setTimeout para garantir que o listener seja registrado primeiro
    setTimeout(() => {
      checkSession();
    }, 0);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Combine auth services with context
  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp: authService.signUp,
    signIn: authService.signIn,
    signOut: authService.signOut,
    resetPassword: authService.resetPassword,
    updateProfile: avatarService.updateProfile,
    uploadAvatar: avatarService.uploadAvatar,
    forceLogout: authService.forceLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    console.log('Verificando autenticação...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
    
    if (data.session) {
      console.log('Usuário autenticado:', data.session.user.id);
      return true;
    }
    
    console.log('Usuário não autenticado');
    return false;
  } catch (error) {
    console.error('Exceção ao verificar autenticação:', error);
    return false;
  }
}
