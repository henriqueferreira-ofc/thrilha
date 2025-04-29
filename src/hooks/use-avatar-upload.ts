
import { useState } from 'react';
import { supabase } from '../supabase/client';
import { checkAndCreateAvatarsBucket } from '../supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

export function useAvatarUpload(user: User | null) {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Ensures that the avatar bucket exists
   */
  const ensureAvatarBucketExists = async (): Promise<boolean> => {
    return await checkAndCreateAvatarsBucket();
  };

  /**
   * Upload an avatar for the current user
   */
  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setIsUploading(true);
    
    try {
      // Verificar se o bucket existe antes de continuar
      const bucketExists = await ensureAvatarBucketExists();
      if (!bucketExists) {
        throw new Error('Não foi possível acessar o bucket de avatares');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('Iniciando upload do avatar:', filePath);
      
      // Fazer o upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatares')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      // Verificar se o arquivo foi realmente enviado
      const { data: checkData, error: checkError } = await supabase.storage
        .from('avatares')
        .download(filePath);

      if (checkError || !checkData) {
        console.error('Erro ao verificar arquivo:', checkError);
        throw new Error('Arquivo não encontrado após upload');
      }

      // Obter URL pública do Supabase
      const { data: urlData } = supabase.storage
        .from('avatares')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Não foi possível gerar URL pública');
      }
      
      const publicUrl = urlData.publicUrl;
      console.log('URL pública gerada:', publicUrl);
      
      // Atualizar o perfil com a URL pública
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        throw updateError;
      }
      
      // Adicionar timestamp para evitar problemas de cache
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      return urlWithTimestamp;
    } catch (error) {
      console.error('Erro completo no upload:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Update user profile data
   */
  const updateProfile = async (data: { avatar_url?: string }) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        throw updateError;
      }

      toast.success('Perfil atualizado com sucesso!');
      return data.avatar_url || '';
    } catch (error: unknown) {
      console.error('Erro completo ao atualizar perfil:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
      throw error;
    }
  };

  return {
    uploadAvatar,
    updateProfile,
    isUploading
  };
}
