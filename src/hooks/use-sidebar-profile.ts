
import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import { toast } from 'sonner';

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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Configurar assinatura em tempo real para atualizações de perfil
  useEffect(() => {
    if (!user) return;

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
                  setRefreshCounter(c => c + 1);
                  toast.info('Avatar atualizado!');
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
        }
      } catch (error) {
        console.error('Erro ao configurar canal realtime:', error);
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
    };
  }, [user]);

  // Carregar perfil do usuário
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Carregando perfil do usuário:', user.id);
      
      // Buscar perfil do usuário diretamente da tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        
        // Tentar criar o perfil se não existir
        if (profileError.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando...');
          const defaultUsername = user.email ? user.email.split('@')[0] : `user_${user.id.substring(0, 8)}`;
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: defaultUsername,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
          } else if (newProfile) {
            console.log('Novo perfil criado:', newProfile);
            setUsername(newProfile.username || defaultUsername);
            setAvatarUrl(null);
          }
        }
      } else if (profileData) {
        console.log('Perfil carregado:', profileData);
        
        if (profileData.username) {
          setUsername(profileData.username);
        } else {
          const defaultName = user.email 
            ? user.email.split('@')[0] 
            : `user_${user.id.substring(0, 8)}`;
          setUsername(defaultName);
        }
        
        if (profileData.avatar_url) {
          // Adicionar timestamp para evitar problemas de cache
          const url = `${profileData.avatar_url}?t=${Date.now()}`;
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

  // Forçar uma recarga do perfil
  const refreshProfile = () => {
    if (user) {
      console.log('Forçando atualização do perfil...');
      loadUserProfile();
      setRefreshCounter(prev => prev + 1);
    }
  };

  return {
    avatarUrl,
    username,
    loading,
    loadUserProfile,
    refreshProfile,
    setAvatarUrl,
    setUsername,
    refreshCounter
  };
}
