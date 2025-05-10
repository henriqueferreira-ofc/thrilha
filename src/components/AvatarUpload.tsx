
import { useCallback } from 'react';
import { useAvatarUploader } from '../hooks/use-avatar-uploader';
import { User } from '@supabase/supabase-js';
import { ImageLoader } from './ImageLoader';

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
      if (onAvatarChange) {
        onAvatarChange(publicUrl);
      }
    } catch (err) {
      console.error('Erro ao atualizar avatar:', err);
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
          src={currentAvatarUrl}
          fallbackSrc="/default-avatar.png"
          alt="Avatar"
          className="w-full h-full object-cover"
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
