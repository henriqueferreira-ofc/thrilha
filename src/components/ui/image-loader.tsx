
import React from 'react';
import { useImageLoader } from '@/hooks/use-image-loader';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageLoaderProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  fallback?: React.ReactNode;
  showRefreshButton?: boolean;
}

export function ImageLoader({ 
  imageUrl, 
  alt = "Image", 
  className = "", 
  objectFit = "cover",
  fallback,
  showRefreshButton = false
}: ImageLoaderProps) {
  const { loading, error, src, refresh } = useImageLoader(imageUrl, {
    maxRetries: 3,
    timeout: 10000,
    preventCache: true
  });

  const defaultFallback = (
    <Avatar className="w-full h-full bg-gray-800 relative">
      <AvatarFallback className="bg-gray-800 text-gray-400">
        <User className="w-1/2 h-1/2" />
        {showRefreshButton && (
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute bottom-0 right-0 bg-primary/80 rounded-full p-1"
            onClick={(e) => {
              e.stopPropagation();
              refresh();
            }}
          >
            <RefreshCcw className="h-3 w-3" />
          </Button>
        )}
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
    <div className="relative w-full h-full">
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-${objectFit} ${className}`}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={(e) => {
          console.error('ImageLoader: Erro ao renderizar imagem:', e);
          // Se houver erro na renderização, definir para src nula
          e.currentTarget.src = "";
        }}
      />
      
      {showRefreshButton && (
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute bottom-1 right-1 bg-primary/80 rounded-full p-1"
          onClick={() => refresh()}
        >
          <RefreshCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
