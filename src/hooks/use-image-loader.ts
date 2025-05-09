import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

interface UseImageLoaderOptions {
  src?: string | null;
  fallbackSrc?: string;
}

interface UseImageLoaderResult {
  src: string;
  loading: boolean;
  error: Error | null;
}

export function useImageLoader(
  initialSrc?: string | null, 
  options: UseImageLoaderOptions = {}
): UseImageLoaderResult {
  const {
    fallbackSrc = '/default-avatar.png'
  } = options;

  const [imageSrc, setImageSrc] = useState<string>(initialSrc || fallbackSrc);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!initialSrc) {
        setImageSrc(fallbackSrc);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Se for uma URL do Supabase
        if (initialSrc.includes('supabase.co/storage')) {
          // Remover qualquer parâmetro de query existente
          const cleanUrl = initialSrc.split('?')[0];
          
          // Se já for uma URL pública, usar diretamente
          if (cleanUrl.includes('/public/')) {
            setImageSrc(cleanUrl);
            setLoading(false);
            return;
          }

          // Se não for pública, extrair o caminho do arquivo
          const urlParts = cleanUrl.split('/storage/v1/object/');
          if (urlParts.length === 2) {
            const filePath = urlParts[1];
            const { data } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);

            if (data?.publicUrl) {
              setImageSrc(data.publicUrl);
              setLoading(false);
              return;
            }
          }
        }

        // Se não for URL do Supabase ou se falhar em gerar URL pública
        setImageSrc(initialSrc);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('Erro ao carregar imagem:', err);
        setError(err instanceof Error ? err : new Error('Erro ao carregar imagem'));
        setImageSrc(fallbackSrc);
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [initialSrc, fallbackSrc]);

  return {
    src: imageSrc,
    loading,
    error
  };
}
