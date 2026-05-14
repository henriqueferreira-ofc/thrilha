
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabase/client';
import { UserPreferences } from '@/types/common';

const defaultPreferences: UserPreferences = {
  darkMode: true,
  compactMode: false,
  soundEnabled: true,
  pushNotifications: false,
  emailNotifications: true,
  taskReminders: true
};

export function useUserPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUserPreferences = async () => {
    if (!userId) {
      console.log('Usuário não autenticado');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Iniciando carregamento das preferências para o usuário:', userId);
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('preferences')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (settingsError) {
        console.error('Erro ao buscar configurações:', settingsError);
        throw new Error(`Erro ao buscar configurações: ${settingsError.message}`);
      }
      
      if (!settingsData) {
        console.log('Nenhuma configuração encontrada, criando padrão');
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            preferences: defaultPreferences,
          });
        
        if (insertError) {
          console.error('Erro ao criar configurações:', insertError);
          throw new Error(`Erro ao criar configurações: ${insertError.message}`);
        }
        
        setPreferences(defaultPreferences);
        return;
      }
      
      const profileData = settingsData;
      
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
    } catch (error: unknown) {
      console.error('Erro detalhado ao carregar preferências:', error);
      toast.error('Não foi possível carregar suas preferências. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const saveUserPreference = async (key: string, value: boolean) => {
    if (!userId) return;
    
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
        .eq('id', userId);
      
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

  return {
    preferences,
    loading,
    saving,
    loadUserPreferences,
    saveUserPreference
  };
}
