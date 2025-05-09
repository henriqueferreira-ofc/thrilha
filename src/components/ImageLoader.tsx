
import { useState, useEffect } from 'react';
import { useImageLoader } from '../hooks/use-image-loader';

interface ImageLoaderProps {
  src: string | null;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

export function ImageLoader({ src, fallbackSrc, alt, className = '' }: ImageLoaderProps) {
  // Fix the parameters to match the hook's expected signature
  const { src: imageSrc, loading, error } = useImageLoader(src, {
    fallbackSrc,
    maxRetries: 3,
    retryDelay: 1000
  });

  const [currentSrc, setCurrentSrc] = useState<string>(imageSrc || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(imageSrc || fallbackSrc);
  }, [imageSrc, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('ImageLoader: Erro ao renderizar imagem, usando fallback');
    const target = e.target as HTMLImageElement;
    target.src = fallbackSrc;
    setCurrentSrc(fallbackSrc);
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} ${loading ? 'animate-pulse bg-gray-200' : ''}`}
      onError={handleError}
      crossOrigin="anonymous"
    />
  );
} 
