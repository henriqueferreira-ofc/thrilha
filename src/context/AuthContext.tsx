
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, checkAndCreateAvatarsBucket } from '../supabase/client';
import { useAuthService } from '../hooks/use-auth-service';
import { useAvatarUpload } from '../hooks/use-avatar-upload';
import { clearAuthData } from '../utils/auth-utils';

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

  // Initialize authentication state
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

export function isAuthenticated(): boolean {
  return !!supabase.auth.getUser() || !!localStorage.getItem('supabase.auth.token');
}
