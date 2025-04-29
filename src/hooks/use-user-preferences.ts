
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
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        if (profileError.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando novo perfil');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              preferences: defaultPreferences,
              username: '',
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
            throw new Error(`Erro ao criar perfil: ${insertError.message}`);
          }
          
          setPreferences(defaultPreferences);
          return;
        }
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      }
      
      if (!profileData) {
        console.log('Nenhum dado de perfil encontrado, criando perfil padrão');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            preferences: defaultPreferences,
            username: '',
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
          throw new Error(`Erro ao criar perfil: ${insertError.message}`);
        }
        
        setPreferences(defaultPreferences);
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
