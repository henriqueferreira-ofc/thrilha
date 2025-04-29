
import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabase/client';
import { useAuth } from './AuthContext';
import { UserPreferences } from '@/types/common';
import { User } from '@supabase/supabase-js';

const defaultPreferences: UserPreferences = {
  darkMode: true,
  compactMode: false,
  soundEnabled: true,
  pushNotifications: false,
  emailNotifications: true,
  taskReminders: true
};

interface SettingsContextType {
  preferences: UserPreferences;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  loading: boolean;
  saving: boolean;
  user: User | null; // Added user property to match what AccountSettings expects
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
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [bucketsList, setBucketsList] = useState<string[]>([]);

  useEffect(() => {
    if (user && isInitialLoad) {
      loadUserPreferences();
      setIsInitialLoad(false);
    }
  }, [user, isInitialLoad]);

  const loadUserPreferences = async () => {
    if (!user) {
      console.log('Usuário não autenticado');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Iniciando carregamento das preferências para o usuário:', user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('preferences, username, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        if (profileError.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando novo perfil');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              preferences: defaultPreferences,
              username: user.email?.split('@')[0] || '',
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
            throw new Error(`Erro ao criar perfil: ${insertError.message}`);
          }
          
          setPreferences(defaultPreferences);
          setUsername(user.email?.split('@')[0] || '');
          return;
        }
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      }
      
      if (!profileData) {
        console.log('Nenhum dado de perfil encontrado, criando perfil padrão');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            preferences: defaultPreferences,
            username: user.email?.split('@')[0] || '',
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
          throw new Error(`Erro ao criar perfil: ${insertError.message}`);
        }
        
        setPreferences(defaultPreferences);
        setUsername(user.email?.split('@')[0] || '');
        return;
      }
      
      console.log('Dados do perfil carregados:', profileData);
      
      let userPrefs = defaultPreferences;
      try {
        if (profileData.preferences) {
          userPrefs = typeof profileData.preferences === 'string' 
            ? JSON.parse(profileData.preferences)
            : profileData.preferences;
          console.log('Preferências parseadas:', userPrefs);
        }
      } catch (parseError) {
        console.error('Erro ao fazer parse das preferências:', parseError);
        userPrefs = defaultPreferences;
      }
      
      setPreferences({
        ...defaultPreferences,
        ...userPrefs
      });
      
      setUsername(profileData.username || '');

      if (profileData.avatar_url) {
        console.log('Avatar URL encontrada:', profileData.avatar_url);
        const cleanUrl = profileData.avatar_url.split('?')[0];
        console.log('URL limpa:', cleanUrl);
        setAvatarUrl(cleanUrl);
      } else {
        const metadataAvatar = user.user_metadata?.avatar_url;
        console.log('Avatar do metadata:', metadataAvatar);
        if (metadataAvatar) {
          const cleanUrl = metadataAvatar.split('?')[0];
          console.log('URL limpa do metadata:', cleanUrl);
          setAvatarUrl(cleanUrl);
        }
      }
    } catch (error: unknown) {
      console.error('Erro detalhado ao carregar preferências:', error);
      toast.error('Não foi possível carregar suas preferências. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const saveUserPreference = async (key: string, value: boolean) => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));
      
      const updatedPreferences = {
        ...preferences,
        [key]: value
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPreferences
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Erro ao salvar preferência:', error);
        setPreferences(prev => ({
          ...prev,
          [key]: !value
        }));
        throw error;
      }
      
      toast.success('Preferência atualizada com sucesso');
    } catch (error: unknown) {
      console.error('Erro ao salvar preferência:', error);
      toast.error('Não foi possível salvar sua preferência');
    } finally {
      setSaving(false);
    }
  };
  
  const saveUsername = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Nome de usuário atualizado com sucesso');
    } catch (error: unknown) {
      console.error('Erro ao salvar nome de usuário:', error);
      toast.error('Não foi possível salvar seu nome de usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUrlChange = async (url: string) => {
    try {
      setAvatarUrl(url);
    } catch (error) {
      console.error('Erro ao atualizar avatar URL no state:', error);
    }
  };

  const testSupabaseConnection = async () => {
    try {
      setTestingConnection(true);
      
      console.log('Testando conexão com Supabase...');
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Erro ao listar buckets:', error);
        toast.error('Erro ao conectar com Supabase Storage');
        return;
      }
      
      console.log('Buckets disponíveis:', buckets);
      setBucketsList(buckets.map(b => b.name));
      
      const avatarBucket = buckets.find(b => b.name === 'avatars');
      if (!avatarBucket) {
        console.error('Bucket de avatares não encontrado!');
        toast.error('Bucket de avatares não encontrado');
        return;
      }
      
      toast.success('Conexão com Supabase OK');
      
      const { data: files, error: filesError } = await supabase.storage
        .from('avatars')
        .list();
        
      if (filesError) {
        console.error('Erro ao listar arquivos:', filesError);
        return;
      }
      
      console.log('Arquivos no bucket avatars:', files);
      
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão com Supabase');
    } finally {
      setTestingConnection(false);
    }
  };

  const value = {
    preferences,
    username,
    fullName,
    avatarUrl,
    loading,
    saving,
    user, // Pass user to context
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
