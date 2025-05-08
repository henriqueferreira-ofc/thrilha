
import React from 'react';
import { useImageLoader } from '@/hooks/use-image-loader';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ImageLoaderProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  fallback?: React.ReactNode;
}

export function ImageLoader({ 
  imageUrl, 
  alt = "Image", 
  className = "", 
  objectFit = "cover",
  fallback
}: ImageLoaderProps) {
  const { loading, error, src } = useImageLoader(imageUrl, {
    maxRetries: 3,
    timeout: 10000
  });

  const defaultFallback = (
    <Avatar className="w-full h-full bg-gray-800">
      <AvatarFallback className="bg-gray-800 text-gray-400">
        <User className="w-1/2 h-1/2" />
      </AvatarFallback>
    </Avatar>
  );

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !src) {
    console.log('ImageLoader: Renderizando fallback devido a erro:', error);
    return fallback || defaultFallback;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-${objectFit} ${className}`}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={(e) => {
        console.error('ImageLoader: Erro ao renderizar imagem:', e);
      }}
    />
  );
}
