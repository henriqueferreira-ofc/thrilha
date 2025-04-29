
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabase/client';
import { User } from '@supabase/supabase-js';

export function useUserProfile(user: User | null) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [bucketsList, setBucketsList] = useState<string[]>([]);

  const loadUserProfile = async () => {
    if (!user) {
      console.log('Usuário não autenticado');
      return;
    }
    
    try {
      console.log('Carregando perfil para o usuário:', user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', profileError);
        return;
      }
      
      if (profileData) {
        console.log('Dados do perfil carregados:', profileData);
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
      } else {
        // Set default username from email if profile doesn't exist
        setUsername(user.email?.split('@')[0] || '');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Fallback to email username
      if (user.email) {
        setUsername(user.email.split('@')[0]);
      }
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

  return {
    username,
    fullName,
    avatarUrl,
    saving,
    testingConnection,
    bucketsList,
    setUsername,
    setFullName,
    loadUserProfile,
    saveUsername,
    handleAvatarUrlChange,
    testSupabaseConnection
  };
}
