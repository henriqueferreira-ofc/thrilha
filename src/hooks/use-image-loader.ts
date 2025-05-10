
import { useState, useEffect, useCallback } from 'react';

interface UseImageLoaderOptions {
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
  refresh: () => void;
}

export function useImageLoader(
  initialSrc?: string | null, 
  options: UseImageLoaderOptions = {}
): UseImageLoaderResult {
  const {
    fallbackSrc = '/default-avatar.png',
    maxRetries = 2,
    retryDelay = 1000,
    preventCache = true,
    timeout = 10000
  } = options;

  const [imageSrc, setImageSrc] = useState<string>(initialSrc || fallbackSrc);
  const [loading, setLoading] = useState<boolean>(!!initialSrc);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  const refresh = useCallback(() => {
    setRetryCount(0);
    setRefreshCounter(prev => prev + 1);
  }, []);

  const loadImage = useCallback(async (src: string) => {
    if (!src || src === fallbackSrc) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Adicionar timestamp se solicitado para prevenir cache
      const urlToLoad = preventCache ? 
        `${src.split('?')[0]}?t=${Date.now()}` : src;
      
      // Criar uma promessa para carregar a imagem com timeout
      const imagePromise = new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao carregar imagem'));
        img.src = urlToLoad;
      });
      
      // Criar uma promessa para o timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar imagem')), timeout);
      });
      
      // Corrida entre o carregamento da imagem e o timeout
      await Promise.race([imagePromise, timeoutPromise]);
      
      // Se chegou aqui, a imagem carregou com sucesso
      setImageSrc(urlToLoad);
      setLoading(false);
      setRetryCount(0);
    } catch (err) {
      console.error('Erro ao carregar imagem:', err);
      
      // Tentar novamente se não atingiu o máximo de tentativas
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadImage(src), retryDelay);
      } else {
        // Usar o fallback após todas as tentativas
        setError(err instanceof Error ? err : new Error('Erro ao carregar imagem'));
        setImageSrc(fallbackSrc);
        setLoading(false);
      }
    }
  }, [fallbackSrc, maxRetries, preventCache, retryCount, retryDelay, timeout]);

  useEffect(() => {
    if (initialSrc) {
      loadImage(initialSrc);
    } else {
      setImageSrc(fallbackSrc);
      setLoading(false);
    }
  }, [initialSrc, fallbackSrc, loadImage, refreshCounter]);

  return {
    src: imageSrc,
    loading,
    error,
    refresh
  };
}
