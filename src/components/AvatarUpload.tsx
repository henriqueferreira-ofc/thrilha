
import { useCallback } from 'react';
import { useAvatarUploader } from '../hooks/use-avatar-uploader';
import type { User } from '@supabase/supabase-js';
import { ImageLoader } from './ui/image-loader';
import { User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  user: User | null;
  currentAvatarUrl: string | null;
  onAvatarChange?: (url: string) => void;
  size?: "sm" | "md" | "lg";
}

export function AvatarUpload({ 
  user, 
  currentAvatarUrl, 
  onAvatarChange, 
  size = "md" 
}: AvatarUploadProps) {
  const { handleAvatarUpload, isUploading, error } = useAvatarUploader(user);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const publicUrl = await handleAvatarUpload(file);
      console.log('Upload concluído. URL recebida:', publicUrl);
      
      if (onAvatarChange) {
        onAvatarChange(publicUrl);
      }
      
      // Forçar atualização visual
      toast.success("Avatar atualizado com sucesso!");
    } catch (err) {
      console.error('Erro ao atualizar avatar:', err);
      toast.error('Não foi possível fazer upload da imagem');
    }
  }, [handleAvatarUpload, onAvatarChange]);

  // Determinar o tamanho com base na prop size
  const getAvatarSize = () => {
    switch(size) {
      case "sm": return "w-16 h-16";
      case "lg": return "w-32 h-32";
      case "md":
      default: return "w-24 h-24";
    }
  };

  return (
    <div className="relative group">
      <div className={`relative ${getAvatarSize()} rounded-full overflow-hidden`}>
        <ImageLoader
          imageUrl={currentAvatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
          showRefreshButton={true}
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <UserIcon className="h-1/2 w-1/2 text-gray-400" />
            </div>
          }
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <label className="cursor-pointer text-white text-sm font-medium">
            {isUploading ? 'Enviando...' : 'Alterar'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}
