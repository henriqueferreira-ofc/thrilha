
import React from 'react';
import { User } from 'lucide-react';
import { ImageLoader } from '../ui/image-loader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarDisplayProps {
  avatarUrl: string | null;
  size: 'sm' | 'md' | 'lg';
}

export function AvatarDisplay({ avatarUrl, size }: AvatarDisplayProps) {
  // Configuração de tamanho
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <Avatar className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-800`}>
      {avatarUrl ? (
        <AvatarImage 
          src={`${avatarUrl}?v=${Date.now()}`} 
          alt="Avatar do usuário" 
          className="object-cover w-full h-full"
        />
      ) : null}
      <AvatarFallback className="bg-purple-500/20">
        <User className="w-1/2 h-1/2 text-purple-500" />
      </AvatarFallback>
    </Avatar>
  );
}
