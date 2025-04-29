
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { User, Upload, Loader2 } from 'lucide-react';
import { ImageTest } from './ImageTest';
import { 
  checkAndCreateAvatarsBucket, 
  AVATARS_BUCKET, 
  getAvatarPublicUrl,
  uploadToAvatarsBucket
} from '../supabase/client';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onAvatarChange?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  onAvatarChange,
  size = 'md'
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bucketChecked, setBucketChecked] = useState(false);
  const { user, uploadAvatar } = useAuth();

  // Verificar o bucket ao carregar o componente
  useEffect(() => {
    const verifyBucket = async () => {
      try {
        console.log('Verificando bucket para AvatarUpload...');
        const exists = await checkAndCreateAvatarsBucket();
        setBucketChecked(exists);
        console.log('Bucket verificado:', exists);
      } catch (error) {
        console.error('Erro ao verificar bucket:', error);
      }
    };
    
    verifyBucket();
  }, []);

  // Processar a URL do avatar quando o componente monta ou quando currentAvatarUrl muda
  useEffect(() => {
    if (currentAvatarUrl) {
      console.log('AvatarUpload recebeu URL:', currentAvatarUrl);
      setAvatarUrl(currentAvatarUrl);
    } else {
      setAvatarUrl(null);
    }
  }, [currentAvatarUrl]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const uploadButtonSizes = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      setUploadError(null);
      
      // Prevenir envio de arquivos muito grandes
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 2MB');
      }
      
      // Validar tipos de arquivo permitidos
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        throw new Error('Formato não suportado. Use JPEG, PNG, WEBP ou GIF.');
      }
      
      toast.info('Enviando imagem...');
      
      // Mostrar prévia local antes do upload completo
      const localPreview = URL.createObjectURL(file);
      setAvatarUrl(localPreview);
      
      // Upload para o storage
      if (user) {
        try {
          const publicUrl = await uploadAvatar(file);
          
          // Revogar a URL local para liberar memória
          URL.revokeObjectURL(localPreview);
          
          // Atualizar a URL com a versão do servidor
          console.log('Upload concluído com sucesso. URL:', publicUrl);
          setAvatarUrl(publicUrl);
          
          if (onAvatarChange) {
            onAvatarChange(publicUrl);
          }
          
          toast.success('Avatar atualizado com sucesso');
        } catch (error: unknown) {
          console.error('Erro ao fazer upload:', error);
          
          setUploadError(error instanceof Error ? error.message : 'Erro ao atualizar avatar');
          toast.error(error instanceof Error ? error.message : 'Erro ao atualizar avatar');
          
          // Em caso de erro, manter a URL original
          setAvatarUrl(currentAvatarUrl);
        }
      } else {
        throw new Error('Usuário não autenticado');
      }
    } catch (error: unknown) {
      console.error('Erro durante o processo de upload:', error);
      setUploadError(error instanceof Error ? error.message : 'Erro ao atualizar avatar');
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar avatar');
      
      // Restaurar avatar anterior em caso de erro
      setAvatarUrl(currentAvatarUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-black border-2 border-purple-500`}>
        {avatarUrl ? (
          <ImageTest imageUrl={avatarUrl} />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            {uploading ? (
              <Loader2 className={`${iconSizes[size]} text-gray-400 animate-spin`} />
            ) : (
              <User className={`${iconSizes[size]} text-gray-400`} />
            )}
          </div>
        )}
      </div>
      
      <label 
        htmlFor="avatar-upload" 
        className={`absolute bottom-0 right-0 ${uploadButtonSizes[size]} bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-colors flex items-center justify-center`}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : (
          <Upload className="w-4 h-4 text-white" />
        )}
        <input
          type="file"
          id="avatar-upload"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleAvatarUpload}
          disabled={uploading}
        />
      </label>
      
      {uploadError && (
        <div className="mt-2 text-xs text-red-400">
          {uploadError}
        </div>
      )}
    </div>
  );
}
