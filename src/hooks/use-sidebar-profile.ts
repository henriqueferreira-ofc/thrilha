
import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import { getOrCreateProfile } from '@/supabase/helper';

interface ProfilePayload {
  id: string;
  avatar_url: string | null;
  username?: string;
  updated_at?: string;
  full_name?: string | null;
  website?: string | null;
}

export function useSidebarProfile(user: User | null) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const isSettingUpChannel = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Configurar assinatura em tempo real para atualizações de perfil
  useEffect(() => {
    if (!user || isSettingUpChannel.current) return;

    isSettingUpChannel.current = true;

    const setupChannel = async () => {
      try {
        // Limpar qualquer canal existente
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Criar um novo canal com ID único
        const channelId = `profile-changes-${user.id.slice(0, 8)}-${Date.now()}`;
        console.log('Criando canal com ID:', channelId);

        // Configurar o novo canal para atualizações de perfil
        channelRef.current = supabase
          .channel(channelId)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              console.log('Recebida atualização de perfil:', payload);
              
              const newProfile = payload.new as ProfilePayload;
              if (newProfile) {
                console.log('Novo perfil recebido:', newProfile);
                
                if (newProfile.avatar_url) {
                  // Adicionar timestamp para evitar cache
                  const newUrl = `${newProfile.avatar_url}?t=${Date.now()}`;
                  console.log('Definindo nova avatar URL:', newUrl);
                  setAvatarUrl(newUrl);
                }
                
                if (newProfile.username) {
                  setUsername(newProfile.username);
                }
              }
            }
          );

        try {
          // Inscrever-se no canal
          await channelRef.current.subscribe();
          console.log('Canal inscrito com sucesso:', channelId);
          
          // Carregar perfil inicial
          await loadUserProfile();
        } catch (err) {
          console.error('Erro ao inscrever no canal:', err);
          
          // Limpar recursos e tentar novamente após um atraso
          channelRef.current = null;
          isSettingUpChannel.current = false;
          
          setTimeout(() => setupChannel(), 5000);
        }
      } catch (error) {
        console.error('Erro ao configurar canal realtime:', error);
        isSettingUpChannel.current = false;
      }
    };

    // Iniciar a configuração do canal
    setupChannel();

    // Limpar na desmontagem
    return () => {
      if (channelRef.current) {
        console.log('Removendo canal:', channelRef.current.topic);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSettingUpChannel.current = false;
    };
  }, [user]);

  // Carregar perfil do usuário
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Carregando perfil do usuário:', user.id);
      
      const { profile, error } = await getOrCreateProfile(user.id);
      
      if (profile) {
        console.log('Perfil carregado:', profile);
        
        if (profile.username) {
          setUsername(profile.username);
        } else {
          const defaultName = user.email 
            ? user.email.split('@')[0] 
            : `user_${user.id.substring(0, 8)}`;
          setUsername(defaultName);
        }
        
        if (profile.avatar_url) {
          // Adicionar timestamp para evitar problemas de cache
          const url = `${profile.avatar_url}?t=${Date.now()}`;
          console.log('URL de avatar definida:', url);
          setAvatarUrl(url);
        } else {
          setAvatarUrl(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      
      // Fallback para nome de usuário do email
      if (user?.email) {
        setUsername(user.email.split('@')[0]);
      } else if (user?.id) {
        setUsername(`user_${user.id.substring(0, 8)}`);
      } else {
        setUsername('Usuário');
      }
      setAvatarUrl(null);
    } finally {
      setLoading(false);
    }
  };

  // Carregamento inicial do perfil
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  return {
    avatarUrl,
    username,
    loading,
    loadUserProfile,
    setAvatarUrl,
    setUsername
  };
}
