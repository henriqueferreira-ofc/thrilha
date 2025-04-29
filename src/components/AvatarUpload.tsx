
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { User, Upload, Loader2 } from 'lucide-react';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { uploadAvatar, updateProfile } = useAuth();

  // Atualizar o avatarUrl quando o currentAvatarUrl mudar
  useEffect(() => {
    if (currentAvatarUrl !== avatarUrl) {
      setAvatarUrl(currentAvatarUrl);
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
        setUploadError('A imagem deve ter no máximo 2MB');
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }
      
      // Validar tipos de arquivo permitidos
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setUploadError('Formato não suportado. Use JPEG, PNG, WEBP ou GIF.');
        toast.error('Formato não suportado. Use JPEG, PNG, WEBP ou GIF.');
        return;
      }
      
      toast.info('Enviando imagem...');
      
      // Mostrar prévia local antes do upload completo
      const localPreview = URL.createObjectURL(file);
      setAvatarUrl(localPreview);
      
      // Upload para o storage
      const publicUrl = await uploadAvatar(file);
      
      // Atualizar o perfil com a URL do avatar
      await updateProfile({ avatar_url: publicUrl });
      
      // Revogar a URL local para liberar memória
      URL.revokeObjectURL(localPreview);
      
      // Atualizar a URL com a versão do servidor
      setAvatarUrl(publicUrl);
      
      if (onAvatarChange) {
        onAvatarChange(publicUrl);
      }
      
      toast.success('Avatar atualizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      setUploadError(error.message || 'Erro ao atualizar avatar');
      toast.error(error.message || 'Erro ao atualizar avatar');
      
      // Restaurar avatar anterior em caso de erro
      setAvatarUrl(currentAvatarUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} bg-black border-2 border-purple-500`}>
        {avatarUrl ? (
          <AvatarImage 
            src={avatarUrl} 
            alt="Avatar do usuário"
            className="object-cover"
            onError={(e) => {
              console.error('Erro ao carregar imagem do avatar');
              setAvatarUrl(null);
              toast.error('Não foi possível carregar a imagem');
            }}
          />
        ) : (
          <AvatarFallback className="bg-gray-800">
            {uploading ? (
              <Loader2 className={`${iconSizes[size]} text-gray-400 animate-spin`} />
            ) : (
              <User className={`${iconSizes[size]} text-gray-400`} />
            )}
          </AvatarFallback>
        )}
      </Avatar>
      
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
