import { useState } from 'react';
import { supabase, AVATARS_BUCKET, checkBucketExists } from '../supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

export function useAvatarUpload(user: User | null) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Upload an avatar for the current user
   */
  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Verificar se o bucket existe
      await checkBucketExists();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${AVATARS_BUCKET}/${fileName}`;
      
      console.log('Iniciando upload do avatar:', filePath);
      
      // Fazer o upload
      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(fileName, file, {
          cacheControl: '0', // Sem cache
          upsert: true
        });
        
      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }

      // Verificar se o arquivo foi realmente enviado
      const { data: checkData, error: checkError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .download(fileName);

      if (checkError || !checkData) {
        console.error('Erro ao verificar arquivo:', checkError);
        throw new Error('Arquivo não encontrado após upload');
      }

      // Obter URL pública do Supabase
      const { data: { publicUrl } } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(fileName);
      
      if (!publicUrl) {
        throw new Error('Não foi possível gerar URL pública');
      }
      
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
      
      return publicUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido ao fazer upload');
      setError(error);
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
    isUploading,
    error
  };
}
