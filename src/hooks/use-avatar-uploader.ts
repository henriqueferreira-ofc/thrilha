
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { AVATARS_BUCKET, getAvatarPublicUrl, supabase } from '../supabase/client';
import { User } from '@supabase/supabase-js';

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
      
      // Prevenir envio de arquivos muito grandes
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }
      
      // Validar tipos de arquivo permitidos
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        throw new Error('Formato não suportado. Use JPEG, PNG, WEBP ou GIF.');
      }
      
      toast.info('Enviando imagem...');
      
      // Mostrar prévia local antes do upload completo
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
      }
      localPreviewRef.current = URL.createObjectURL(file);
      console.log('AvatarUploader: Prévia local criada:', localPreviewRef.current);
      
      // Upload para o storage
      if (user) {
        try {
          // Preparar o caminho do arquivo
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}_${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`; // Remover prefixo avatars/
          
          console.log('AvatarUploader: Iniciando upload para:', filePath);
          
          // Fazer upload direto pelo cliente Supabase
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(AVATARS_BUCKET)
            .upload(filePath, file, {
              cacheControl: '0', // Sem cache
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
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('AvatarUploader: Erro ao atualizar perfil:', updateError);
            throw updateError;
          }
          
          // Limpar a prévia local após o upload bem-sucedido
          if (localPreviewRef.current) {
            URL.revokeObjectURL(localPreviewRef.current);
            localPreviewRef.current = null;
          }
          
          if (onAvatarChange) {
            onAvatarChange(publicUrl);
          }
          
          toast.success('Avatar atualizado com sucesso!');
        } catch (error) {
          console.error('AvatarUploader: Erro no upload:', error);
          setUploadError('Erro ao fazer upload da imagem');
          toast.error('Erro ao fazer upload da imagem');
        }
      }
    } catch (error) {
      console.error('AvatarUploader: Erro ao processar arquivo:', error);
      setUploadError(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      toast.error(error instanceof Error ? error.message : 'Erro ao processar arquivo');
    } finally {
      setUploading(false);
    }
  };

  // Cleanup function for URL objects
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
