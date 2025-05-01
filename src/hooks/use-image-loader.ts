
import { useState, useEffect } from 'react';

// Cache of URLs that have been successfully loaded
const successfulUrls = new Set<string>();

interface UseImageLoaderOptions {
  maxRetries?: number;
  timeout?: number;
}

interface UseImageLoaderResult {
  src: string;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export function useImageLoader(
  imageUrl: string | null, 
  options: UseImageLoaderOptions = {}
): UseImageLoaderResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [src, setSrc] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = options.maxRetries ?? 3;
  const timeout = options.timeout ?? 10000;

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadImage = async () => {
      if (!imageUrl) {
        console.log('ImageLoader: URL não fornecida');
        setError('URL de imagem não fornecida');
        setLoading(false);
        return;
      }

      console.log('ImageLoader: Iniciando carregamento da URL:', imageUrl);
      setLoading(true);
      setError(null);

      // Normalize the URL to avoid problems with duplicate paths
      let normalizedUrl = imageUrl;
      if (normalizedUrl.includes('avatars/avatars/')) {
        normalizedUrl = normalizedUrl.replace('avatars/avatars/', 'avatars/');
      }

      // If it's a blob URL, use it directly
      if (normalizedUrl.startsWith('blob:')) {
        console.log('ImageLoader: Usando URL blob');
        setSrc(normalizedUrl);
        setLoading(false);
        return;
      }

      // If the URL has been successfully loaded before, use it directly
      if (successfulUrls.has(normalizedUrl)) {
        console.log('ImageLoader: Usando URL do cache:', normalizedUrl);
        setSrc(normalizedUrl);
        setLoading(false);
        return;
      }

      try {
        // For public URLs, add timestamp to prevent caching
        const urlWithTimestamp = `${normalizedUrl}${normalizedUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        console.log('ImageLoader: URL com timestamp:', urlWithTimestamp);

        const img = new Image();
        
        const loadPromise = new Promise<string>((resolve, reject) => {
          img.onload = () => {
            console.log('ImageLoader: Imagem carregada com sucesso');
            successfulUrls.add(normalizedUrl); // Add to cache
            resolve(urlWithTimestamp);
          };
          
          img.onerror = (e) => {
            console.error('ImageLoader: Erro ao carregar imagem:', e);
            reject(new Error('Erro ao carregar imagem'));
          };
        });

        // Add timeout for loading
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            img.src = ''; // Cancel loading
            reject(new Error('Timeout ao carregar imagem'));
          }, timeout);
        });

        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
        img.src = urlWithTimestamp;
        
        const result = await Promise.race([loadPromise, timeoutPromise]);

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (isMounted) {
          setSrc(result);
          setLoading(false);
          setError(null);
          setRetryCount(0); // Reset retry count on success
        }
      } catch (error) {
        console.error('ImageLoader: Erro ao carregar imagem:', error);
        if (isMounted) {
          if (retryCount < maxRetries) {
            console.log(`ImageLoader: Tentativa ${retryCount + 1} de ${maxRetries}`);
            setRetryCount(prev => prev + 1);
            // Try again after a small delay
            setTimeout(() => {
              if (isMounted) {
                loadImage();
              }
            }, 1000 * (retryCount + 1)); // Increasing delay
          } else {
            setLoading(false);
            setError('Erro ao carregar imagem');
            setSrc('');
          }
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.log('ImageLoader: Limpando effect');
    };
  }, [imageUrl, retryCount, maxRetries, timeout]);

  return { loading, error, src, retryCount };
}
