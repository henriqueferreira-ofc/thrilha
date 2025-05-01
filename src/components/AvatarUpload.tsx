
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AvatarDisplay } from './avatar/AvatarDisplay';
import { UploadOverlay } from './avatar/UploadOverlay';
import { useAvatarUploader } from '@/hooks/use-avatar-uploader';

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

  // Cleanup the URL when component unmounts
  useEffect(() => {
    return () => {
      cleanupLocalPreview();
    };
  }, []);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleAvatarUpload(file);
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
