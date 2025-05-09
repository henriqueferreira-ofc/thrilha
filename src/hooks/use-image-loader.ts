
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';

interface UseImageLoaderOptions {
  src?: string | null;
  fallbackSrc?: string;
  maxRetries?: number;
  retryDelay?: number;
  preventCache?: boolean;
  timeout?: number;
}

interface UseImageLoaderResult {
  src: string;
  loading: boolean;
  error: Error | null;
  refresh: () => void; // Adicionamos o método refresh ao tipo
}

export function useImageLoader(
  initialSrc?: string | null, 
  options: UseImageLoaderOptions = {}
): UseImageLoaderResult {
  const {
    fallbackSrc = '/default-avatar.png',
    maxRetries = 3,
    retryDelay = 1000,
    preventCache = true,
    timeout = 15000
  } = options;

  const [imageSrc, setImageSrc] = useState<string>(initialSrc || fallbackSrc);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Implementa a função refresh
  const refresh = useCallback(() => {
    setRetryCount(0);
    setRefreshCounter(prev => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number;

    const loadImage = async () => {
      if (!initialSrc) {
        setImageSrc(fallbackSrc);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Adicionar parâmetro para evitar cache se preventCache estiver habilitado
        const urlWithTimestamp = preventCache 
          ? `${initialSrc}${initialSrc.includes('?') ? '&' : '?'}t=${Date.now()}-${refreshCounter}`
          : initialSrc;

        // Verificar se a URL é do Supabase Storage
        const isSupabaseUrl = urlWithTimestamp.includes('supabase.co/storage');
        
        if (isSupabaseUrl) {
          try {
            // Extrair o caminho do arquivo da URL e remover parâmetros de query
            const urlParts = urlWithTimestamp.split('/storage/v1/object/public/');
            if (urlParts.length === 2) {
              const fullPath = urlParts[1].split('?')[0]; // Remover parâmetros de query
              // Remover o bucket name do início do caminho
              const filePath = fullPath.split('/').slice(1).join('/');
              console.log('ImageLoader: Gerando URL pública para:', filePath);
              
              // Gerar URL pública
              const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

              if (publicUrlData?.publicUrl) {
                console.log('ImageLoader: URL pública gerada com sucesso');
                setImageSrc(publicUrlData.publicUrl);
                setLoading(false);
                setError(null);
                setRetryCount(0);
                return;
              }
            }
          } catch (err) {
            console.error('ImageLoader: Erro ao gerar URL pública:', err);
            // Se falhar, tenta carregar a URL original
          }
        }

        // Se não for URL do Supabase ou se falhar em gerar URL pública
        const img = new Image();
        img.crossOrigin = "anonymous";

        const loadPromise = new Promise<string>((resolve, reject) => {
          img.onload = () => {
            console.log('ImageLoader: Imagem carregada com sucesso');
            resolve(urlWithTimestamp);
          };
          
          img.onerror = (e) => {
            console.error('ImageLoader: Erro ao carregar imagem:', e);
            reject(new Error('Erro ao carregar imagem'));
          };
          
          img.src = urlWithTimestamp;
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new Error('Timeout ao carregar imagem'));
          }, timeout);
        });

        const result = await Promise.race([loadPromise, timeoutPromise]);

        if (isMounted) {
          setImageSrc(result);
          setLoading(false);
          setError(null);
          setRetryCount(0);
        }
      } catch (err) {
        if (!isMounted) return;

        console.error('ImageLoader: Erro ao carregar imagem:', err);

        if (retryCount < maxRetries) {
          console.log(`ImageLoader: Tentativa ${retryCount + 1} de ${maxRetries}`);
          setRetryCount(prev => prev + 1);
          timeoutId = window.setTimeout(() => {
            if (isMounted) {
              loadImage();
            }
          }, retryDelay * (retryCount + 1));
        } else {
          console.log('ImageLoader: Todas as tentativas falharam, usando fallback');
          setLoading(false);
          setError(err instanceof Error ? err : new Error('Erro ao carregar imagem'));
          setImageSrc(fallbackSrc);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [initialSrc, fallbackSrc, maxRetries, retryDelay, retryCount, refreshCounter, timeout, preventCache]);

  return {
    src: imageSrc,
    loading,
    error,
    refresh
  };
}
