
import { useState, useEffect, useRef } from 'react';
import { User, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
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
  
  // Setup real-time subscription for profile updates
  useEffect(() => {
    if (!user || isSettingUpChannel.current) return;

    isSettingUpChannel.current = true;

    const setupChannel = async () => {
      try {
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current).catch(e => {
            console.warn('Erro ao remover canal existente:', e);
          });
          channelRef.current = null;
        }

        const channelId = `profile-changes-${user.id.slice(0, 8)}-${Date.now()}`;
        console.log('Criando canal com ID:', channelId);

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
            (payload: RealtimePostgresChangesPayload<ProfilePayload>) => {
              console.log('Recebida atualização de perfil:', payload);
              
              const newProfile = payload.new as ProfilePayload;
              if (newProfile && newProfile.avatar_url) {
                const newUrl = newProfile.avatar_url + '?t=' + new Date().getTime();
                setAvatarUrl(newUrl);
                
                if (newProfile.username) {
                  setUsername(newProfile.username);
                }
              } else {
                loadUserProfile();
              }
            }
          );

        try {
          await channelRef.current.subscribe();
          console.log('Canal inscrito com sucesso:', channelId);
        } catch (err) {
          console.error('Erro ao inscrever no canal:', err);
          
          channelRef.current = null;
          isSettingUpChannel.current = false;
          
          setTimeout(() => setupChannel(), 5000);
        }
      } catch (error) {
        console.error('Erro ao configurar canal realtime:', error);
        isSettingUpChannel.current = false;
      }
    };

    setupChannel();

    return () => {
      if (channelRef.current) {
        console.log('Removendo canal:', channelRef.current.topic);
        supabase.removeChannel(channelRef.current).catch(err => {
          console.error('Erro ao remover canal sidebar:', err);
        });
        channelRef.current = null;
      }
      isSettingUpChannel.current = false;
    };
  }, [user]);

  // Load user profile
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Carregando perfil do usuário:', user.id);
      
      const { profile, isNew, error } = await getOrCreateProfile(user.id);
      
      if (error) {
        console.warn('Houve um erro, mas temos um perfil fallback:', error);
      }
      
      if (profile) {
        console.log(`Perfil ${isNew ? 'criado' : 'carregado'}:`, profile);
        
        if (profile.username) {
          setUsername(profile.username);
        } else {
          const defaultName = user.email 
            ? user.email.split('@')[0] 
            : `user_${user.id.substring(0, 8)}`;
          setUsername(defaultName);
        }
        
        if (profile.avatar_url) {
          // Limpar a URL e adicionar timestamp para prevenir cache
          let url = profile.avatar_url;
          if (url.includes('avatars/avatars/')) {
            url = url.replace('avatars/avatars/', 'avatars/');
          }
          // Adicionar timestamp para evitar problemas de cache
          url = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
          setAvatarUrl(url);
        } else {
          setAvatarUrl(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar/criar perfil:', error);
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

  // Initial loading of profile
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
