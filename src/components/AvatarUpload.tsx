
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AvatarDisplay } from './avatar/AvatarDisplay';
import { UploadOverlay } from './avatar/UploadOverlay';
import { useAvatarUploader } from '@/hooks/use-avatar-uploader';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadError, handleAvatarUpload, cleanupLocalPreview } = useAvatarUploader(
    user, 
    currentAvatarUrl, 
    onAvatarChange
  );

  // Limpar a URL quando o componente for desmontado
  useEffect(() => {
    return () => {
      cleanupLocalPreview();
    };
  }, []);

  const handleClick = () => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar seu avatar');
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const url = await handleAvatarUpload(file);
        console.log("Avatar atualizado com sucesso, nova URL:", url);
        
        // Resetar o input para permitir selecionar o mesmo arquivo novamente
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error("Erro ao atualizar avatar:", error);
      }
    }
  };

  return (
    <div className="relative group">
      <div 
        className="relative cursor-pointer"
        onClick={handleClick}
      >
        <AvatarDisplay avatarUrl={currentAvatarUrl} size={size} />
        <UploadOverlay size={size} uploading={uploading} />
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {uploadError && (
        <p className="mt-2 text-sm text-red-500 text-center">{uploadError}</p>
      )}
    </div>
  );
}
