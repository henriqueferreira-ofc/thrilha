
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { UserPreferences } from '@/types/common';
import { User } from '@supabase/supabase-js';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useUserProfile } from '@/hooks/use-user-profile';

interface SettingsContextType {
  preferences: UserPreferences;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  loading: boolean;
  saving: boolean;
  user: User | null;
  saveUserPreference: (key: string, value: boolean) => Promise<void>;
  saveUsername: () => Promise<void>;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setFullName: React.Dispatch<React.SetStateAction<string>>;
  handleAvatarUrlChange: (url: string) => Promise<void>;
  testSupabaseConnection: () => Promise<void>;
  testingConnection: boolean;
  bucketsList: string[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Use our custom hooks
  const { 
    preferences, 
    saving: savingPreferences, 
    saveUserPreference, 
    loadUserPreferences 
  } = useUserPreferences(user?.id);
  
  const {
    username,
    fullName,
    avatarUrl,
    saving: savingProfile,
    testingConnection,
    bucketsList,
    setUsername,
    setFullName,
    loadUserProfile,
    saveUsername,
    handleAvatarUrlChange,
    testSupabaseConnection
  } = useUserProfile(user);

  useEffect(() => {
    if (user && isInitialLoad) {
      // Load both preferences and profile data
      Promise.all([
        loadUserPreferences(),
        loadUserProfile()
      ]).finally(() => {
        setLoading(false);
        setIsInitialLoad(false);
      });
    }
  }, [user, isInitialLoad]);

  // Combine saving states from both hooks
  const saving = savingPreferences || savingProfile;

  const value = {
    preferences,
    username,
    fullName,
    avatarUrl,
    loading,
    saving,
    user,
    saveUserPreference,
    saveUsername,
    setUsername,
    setFullName,
    handleAvatarUrlChange,
    testSupabaseConnection,
    testingConnection,
    bucketsList,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
