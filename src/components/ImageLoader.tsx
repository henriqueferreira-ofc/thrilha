import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function ImageLoader({ src, alt, className, fallbackClassName }: ImageLoaderProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const handleError = () => {
    console.error(`Erro ao carregar imagem: ${src}`);
    setHasError(true);
  };

  if (hasError || !src) {
    return (
      <div className={`flex items-center justify-center bg-purple-500/20 ${fallbackClassName}`}>
        <User className="w-6 h-6 text-purple-500" />
      </div>
    );
  }

  return (
    <picture>
      <source srcSet={src} type="image/webp" />
      <source srcSet={src} type="image/jpeg" />
      <source srcSet={src} type="image/png" />
      <img
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
        loading="lazy"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </picture>
  );
}
