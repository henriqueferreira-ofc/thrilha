
import React, { useState, useEffect } from 'react';
import { User, RefreshCcw, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(!!imageUrl);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  
  useEffect(() => {
    // Adicione timestamp para evitar cache apenas quando a URL mudar
    if (imageUrl) {
      const baseUrl = imageUrl.split('?')[0];
      const newUrl = `${baseUrl}?t=${Date.now()}`;
      console.log('ImageLoader: Definindo URL com timestamp:', newUrl);
      setCurrentSrc(newUrl);
      setIsLoading(true);
      setHasError(false);
    } else {
      setCurrentSrc(null);
      setIsLoading(false);
    }
  }, [imageUrl, retryCounter]);
  
  const handleRefresh = () => {
    console.log('Atualizando imagem...');
    setRetryCounter(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
    toast.info('Recarregando imagem...');
  };

  const handleError = () => {
    console.error('Erro ao carregar imagem:', currentSrc);
    setIsLoading(false);
    setHasError(true);
    toast.error('Não foi possível carregar a imagem');
  };

  const handleLoad = () => {
    console.log('Imagem carregada com sucesso:', currentSrc);
    setIsLoading(false);
    setHasError(false);
  };

  // Renderizar fallback se imagem não existir ou houver erro
  if (hasError || !currentSrc) {
    return (
      <div className="relative w-full h-full">
        {fallback || (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-400">
            <Image className="w-1/3 h-1/3 mb-2 opacity-50" />
            <span className="text-xs">Sem imagem</span>
            
            {showRefreshButton && (
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute bottom-1 right-1 bg-purple-600/80 hover:bg-purple-700 rounded-full p-1"
                onClick={handleRefresh}
              >
                <RefreshCcw className="h-3 w-3 text-white" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
          <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-${objectFit} ${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ transition: 'opacity 0.3s ease' }}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        loading="eager"
        onError={handleError}
        onLoad={handleLoad}
      />
      
      {showRefreshButton && !isLoading && (
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute bottom-1 right-1 bg-purple-600/80 hover:bg-purple-700 rounded-full p-1"
          onClick={handleRefresh}
        >
          <RefreshCcw className="h-3 w-3 text-white" />
        </Button>
      )}
    </div>
  );
}
