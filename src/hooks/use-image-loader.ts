
import { useState, useEffect } from 'react';

// Cache de URLs que foram carregadas com sucesso
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

      console.log('ImageLoader: Carregando URL:', imageUrl);
      setLoading(true);
      setError(null);

      // Normalizar URL para evitar problemas com caminhos duplicados
      let normalizedUrl = imageUrl;
      if (normalizedUrl.includes('avatars/avatars/')) {
        normalizedUrl = normalizedUrl.replace('avatars/avatars/', 'avatars/');
      }

      // Se for uma URL blob, usar diretamente
      if (normalizedUrl.startsWith('blob:')) {
        console.log('ImageLoader: Usando URL blob');
        setSrc(normalizedUrl);
        setLoading(false);
        return;
      }

      // Se a URL já foi carregada com sucesso antes, usar diretamente
      if (successfulUrls.has(normalizedUrl)) {
        console.log('ImageLoader: Usando URL do cache:', normalizedUrl);
        setSrc(normalizedUrl);
        setLoading(false);
        return;
      }

      try {
        // Para URLs públicas, adicionar timestamp para evitar cache
        const urlWithTimestamp = `${normalizedUrl}${normalizedUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        console.log('ImageLoader: URL com timestamp:', urlWithTimestamp);

        const img = new Image();
        
        const loadPromise = new Promise<string>((resolve, reject) => {
          img.onload = () => {
            console.log('ImageLoader: Imagem carregada com sucesso');
            successfulUrls.add(normalizedUrl); // Adicionar ao cache
            resolve(urlWithTimestamp);
          };
          
          img.onerror = (e) => {
            console.error('ImageLoader: Erro ao carregar imagem:', e);
            reject(new Error('Erro ao carregar imagem'));
          };
        });

        // Adicionar timeout para o carregamento
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            img.src = ''; // Cancelar carregamento
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
          setRetryCount(0); // Resetar contagem de tentativas em caso de sucesso
        }
      } catch (error) {
        console.error('ImageLoader: Erro ao carregar imagem:', error);
        if (isMounted) {
          if (retryCount < maxRetries) {
            console.log(`ImageLoader: Tentativa ${retryCount + 1} de ${maxRetries}`);
            setRetryCount(prev => prev + 1);
            // Tentar novamente após um pequeno atraso
            setTimeout(() => {
              if (isMounted) {
                loadImage();
              }
            }, 1000 * (retryCount + 1)); // Atraso crescente
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
