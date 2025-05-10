
import React, { useState, useEffect } from 'react';

interface ImageLoaderProps {
  src?: string | null;
  fallbackSrc?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function ImageLoader({
  src,
  fallbackSrc = '/default-avatar.png',
  alt = 'Imagem',
  className = '',
  style = {},
  onLoad,
  onError
}: ImageLoaderProps) {
  const [imageSrc, setImageSrc] = useState<string>(src || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Atualizar a source quando as props mudarem
    if (src) {
      setImageSrc(src);
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
    } else {
      setImageSrc(fallbackSrc);
    }
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Erro ao carregar imagem:', e);
    const target = e.target as HTMLImageElement;
    
    if (retryCount < 2) {
      // Tentar novamente com timestamp para evitar cache
      console.log(`Tentativa ${retryCount + 1} de 2`);
      setRetryCount(prev => prev + 1);
      
      // Adicionar timestamp para evitar cache
      const baseUrl = target.src.split('?')[0];
      const newUrl = `${baseUrl}?t=${Date.now()}`;
      setImageSrc(newUrl);
    } else {
      // Depois de falhar nas tentativas, usar a imagem fallback
      console.log('Usando imagem fallback após tentativas falhas');
      setError(new Error('Não foi possível carregar a imagem'));
      setImageSrc(fallbackSrc);
      
      if (onError) {
        onError(new Error('Falha ao carregar imagem'));
      }
    }
  };

  const handleLoad = () => {
    console.log('Imagem carregada com sucesso:', imageSrc);
    setIsLoading(false);
    setRetryCount(0);
    
    if (onLoad) {
      onLoad();
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: isLoading ? 0.7 : 1,
        transition: 'opacity 0.3s ease'
      }}
      onError={handleError}
      onLoad={handleLoad}
      crossOrigin="anonymous"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
