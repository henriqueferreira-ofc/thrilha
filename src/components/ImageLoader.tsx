import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function ImageLoader({
  src,
  alt,
  className,
  fallbackClassName
}: ImageLoaderProps) {
  const [hasError, setHasError] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  useEffect(() => {
    setHasError(false);
    setLoadedSrc(null);

    if (!src) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setLoadedSrc(src);
      console.log('Imagem carregada com sucesso:', src);
    };
    
    img.onerror = () => {
      setHasError(true);
      console.error('Erro ao carregar imagem:', src);
    };
  }, [src]);

  if (hasError || !loadedSrc) {
    return (
      <div className={cn("flex items-center justify-center bg-purple-500/20", fallbackClassName)}>
        <User className="w-6 h-6 text-purple-500" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={loadedSrc}
        alt={alt}
        className={cn("w-full h-full object-cover select-none", className)}
        draggable={false}
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}
