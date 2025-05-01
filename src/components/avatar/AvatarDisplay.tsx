
import React from 'react';
import { User } from 'lucide-react';
import { ImageLoader } from '../ui/image-loader';

interface AvatarDisplayProps {
  avatarUrl: string | null;
  size: 'sm' | 'md' | 'lg';
}

export function AvatarDisplay({ avatarUrl, size }: AvatarDisplayProps) {
  // Size configuration
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

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-800`}>
      {avatarUrl ? (
        <ImageLoader imageUrl={avatarUrl} alt="Avatar do usuário" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <User className={`${iconSizes[size]} text-gray-400`} />
        </div>
      )}
    </div>
  );
}
