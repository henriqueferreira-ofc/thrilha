import React, { useState, useEffect } from 'react';
import { useImageLoader } from '../hooks/use-image-loader';

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
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);
  const [retryCount, setRetryCount] = useState(0);
  const { src: imageSrc, loading, error, refresh } = useImageLoader(src, {
    fallbackSrc,
    maxRetries: 3,
    retryDelay: 1000,
    preventCache: true
  });

  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src || fallbackSrc);
      setRetryCount(0);
    }
  }, [src, fallbackSrc]);

  const handleError = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('ImageLoader: Erro ao renderizar imagem:', {
      src: target.src,
      error: e,
      currentSrc,
      retryCount
    });

    if (retryCount < 3) {
      console.log(`ImageLoader: Tentativa ${retryCount + 1} de 3`);
      setRetryCount(prev => prev + 1);
      
      // Tentar recarregar a imagem com um novo timestamp
      const baseUrl = target.src.split('?')[0];
      const newUrl = `${baseUrl}?t=${Date.now()}`;
      setCurrentSrc(newUrl);
    } else {
      console.log('ImageLoader: Todas as tentativas falharam, usando fallback');
      if (currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      } else {
        console.error('ImageLoader: Fallback também falhou');
        onError?.(new Error('Falha ao carregar imagem e fallback'));
      }
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
      onError={handleError}
      onLoad={() => {
        console.log('ImageLoader: Imagem carregada com sucesso');
        setRetryCount(0);
        onLoad?.();
      }}
      crossOrigin="anonymous"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
} 
