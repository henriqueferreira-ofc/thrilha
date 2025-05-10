
import { useState } from 'react';
import { supabase, AVATARS_BUCKET } from '../supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

export function useAvatarUploader(user: User | null) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAvatarUpload = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setIsUploading(true);
    setError(null);

    try {
      // Validar o arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      // Limitar o tamanho do arquivo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('O arquivo deve ter no máximo 5MB');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('Iniciando upload do avatar:', fileName);

      // Fazer o upload
      const { error: uploadError, data } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(fileName, file, {
          cacheControl: '0',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }

      if (!data || !data.path) {
        throw new Error('Dados de upload inválidos');
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(data.path);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Não foi possível gerar URL pública');
      }

      const publicUrl = urlData.publicUrl;
      console.log('URL pública gerada:', publicUrl);

      // Atualizar o perfil com a URL pública
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
      }

      toast.success('Avatar atualizado com sucesso!');
      return publicUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido ao fazer upload');
      console.error('Erro ao processar arquivo:', error);
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    handleAvatarUpload,
    isUploading,
    error
  };
}
