import React from 'react';
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
  const { src: imageSrc, loading, error } = useImageLoader(src, {
    fallbackSrc
  });

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Erro ao carregar imagem:', {
      src: imageSrc,
      originalSrc: src,
      error: e
    });
    onError?.(new Error('Falha ao carregar imagem'));
  };

  const handleLoad = () => {
    console.log('Imagem carregada com sucesso:', imageSrc);
    onLoad?.();
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
      onError={handleError}
      onLoad={handleLoad}
      crossOrigin="anonymous"
      loading="lazy"
      referrerPolicy="no-referrer"
      decoding="async"
    />
  );
} 
