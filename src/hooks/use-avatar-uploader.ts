
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { AVATARS_BUCKET, getAvatarPublicUrl, supabase } from '../supabase/client';
import { User } from '@supabase/supabase-js';
import { checkAndCreateAvatarsBucket } from '../supabase/client';

export function useAvatarUploader(user: User | null, currentAvatarUrl: string | null, onAvatarChange?: (url: string) => void) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const localPreviewRef = useRef<string | null>(null);

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    
    try {
      console.log('AvatarUploader: Iniciando upload do arquivo:', file.name);
      setUploading(true);
      setUploadError(null);
      
      // Verificar tamanho do arquivo
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }
      
      // Validar tipos de arquivo
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        throw new Error('Formato não suportado. Use JPEG, PNG, WEBP ou GIF.');
      }
      
      toast.info('Enviando imagem...');
      
      // Mostrar prévia local durante o upload
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
      }
      localPreviewRef.current = URL.createObjectURL(file);
      
      if (user) {
        try {
          // Garantir que o bucket exista
          await checkAndCreateAvatarsBucket();
          
          // Preparar o caminho do arquivo
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}_${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          console.log('AvatarUploader: Iniciando upload para:', filePath);
          
          // Fazer upload para o Supabase
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(AVATARS_BUCKET)
            .upload(filePath, file, {
              cacheControl: '0',
              upsert: true
            });
            
          if (uploadError) {
            console.error('AvatarUploader: Erro no upload:', uploadError);
            throw uploadError;
          }
          
          // Gerar URL pública
          const publicUrl = getAvatarPublicUrl(filePath);
          console.log('AvatarUploader: URL pública gerada:', publicUrl);
          
          // Atualizar o perfil com a nova URL
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              avatar_url: publicUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('AvatarUploader: Erro ao atualizar perfil:', updateError);
            throw updateError;
          }
          
          // Limpar preview local após sucesso
          if (localPreviewRef.current) {
            URL.revokeObjectURL(localPreviewRef.current);
            localPreviewRef.current = null;
          }
          
          if (onAvatarChange) {
            onAvatarChange(publicUrl);
          }
          
          toast.success('Avatar atualizado com sucesso!');
          return publicUrl;
        } catch (error) {
          console.error('AvatarUploader: Erro no upload:', error);
          setUploadError('Erro ao fazer upload da imagem');
          toast.error('Erro ao fazer upload da imagem');
          throw error;
        }
      }
    } catch (error) {
      console.error('AvatarUploader: Erro ao processar arquivo:', error);
      setUploadError(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      toast.error(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Limpeza de URLs de objetos
  const cleanupLocalPreview = () => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
  };

  return {
    uploading,
    uploadError,
    handleAvatarUpload,
    cleanupLocalPreview
  };
}
