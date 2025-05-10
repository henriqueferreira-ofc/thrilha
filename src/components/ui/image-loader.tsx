
import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageLoaderProps {
  imageUrl: string | null;
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
  const [retryCounter, setRetryCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(imageUrl);
  
  const handleRefresh = () => {
    setRetryCounter(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
    
    if (imageUrl) {
      // Adicionar um timestamp para evitar cache
      const baseUrl = imageUrl.split('?')[0];
      const newUrl = `${baseUrl}?t=${Date.now()}`;
      setCurrentSrc(newUrl);
    }
  };

  const handleError = () => {
    console.error('Erro ao carregar imagem:', imageUrl);
    setIsLoading(false);
    setHasError(true);
  };

  const handleLoad = () => {
    console.log('Imagem carregada com sucesso:', imageUrl);
    setIsLoading(false);
    setHasError(false);
  };

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
              handleRefresh();
            }}
          >
            <RefreshCcw className="h-3 w-3" />
          </Button>
        )}
      </AvatarFallback>
    </Avatar>
  );

  if (hasError || !currentSrc) {
    return fallback || defaultFallback;
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-full">
        {currentSrc && (
          <img
            src={currentSrc}
            alt={alt}
            className={`w-full h-full object-${objectFit} ${className} opacity-0`}
            onLoad={handleLoad}
            onError={handleError}
            style={{ display: 'none' }}
          />
        )}
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-${objectFit} ${className}`}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        loading="eager"
        onError={handleError}
        onLoad={handleLoad}
      />
      
      {showRefreshButton && (
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute bottom-1 right-1 bg-primary/80 rounded-full p-1 hover:bg-primary/90"
          onClick={handleRefresh}
        >
          <RefreshCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
