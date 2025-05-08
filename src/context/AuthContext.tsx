
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

  // Limpar qualquer estado de autenticação residual
  useEffect(() => {
    console.log('AuthProvider - Verificando se há tokens antigos para limpar');
    
    // Se houver um token no localStorage mas não na sessão Supabase,
    // pode haver um problema de sincronização
    if (localStorage.getItem('supabase.auth.token') && !session) {
      console.log('Token encontrado no localStorage mas sem sessão ativa, limpando');
      clearAuthData();
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    console.log('AuthProvider - Inicializando estado de autenticação');
    let mounted = true;
    
    // Primeiro configurar o listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('AuthProvider - Evento de autenticação:', event);
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setLoading(false);
          
          if (event === 'SIGNED_IN') {
            toast.success('Login realizado com sucesso!');
          } else if (event === 'SIGNED_OUT') {
            toast.info('Você saiu do sistema');
          }
        }
      }
    );

    // Em seguida, verificar a sessão atual
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('AuthProvider - Sessão obtida:', currentSession ? 'Válida' : 'Nenhuma');
      
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
      }
    }).catch(error => {
      console.error('Erro ao obter sessão:', error);
      if (mounted) {
        setLoading(false);
      }
    });

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
    updateProfile: avatarService.updateProfile,
    uploadAvatar: avatarService.uploadAvatar,
    forceLogout: authService.forceLogout,
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

export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}
