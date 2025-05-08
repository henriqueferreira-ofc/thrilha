
import { useState, useEffect, useRef } from 'react';

// Cache de URLs que foram carregadas com sucesso
const successfulUrls = new Set<string>();

interface UseImageLoaderOptions {
  maxRetries?: number;
  timeout?: number;
  preventCache?: boolean;
}

interface UseImageLoaderResult {
  src: string;
  loading: boolean;
  error: string | null;
  retryCount: number;
  refresh: () => void;
}

export function useImageLoader(
  imageUrl: string | null, 
  options: UseImageLoaderOptions = {}
): UseImageLoaderResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [src, setSrc] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const maxRetries = options.maxRetries ?? 3;
  const timeout = options.timeout ?? 10000;
  const preventCache = options.preventCache ?? true;
  const isMounted = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setRetryCount(0);
    setError(null);
    setLoading(true);
  };

  // Limpar timeout ao desmontar
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const loadImage = async () => {
      // Verificar se tem URL
      if (!imageUrl) {
        console.log('ImageLoader: URL não fornecida');
        setError('URL de imagem não fornecida');
        setLoading(false);
        return;
      }

      // Limpar parâmetros de timestamp acumulados
      let cleanUrl = imageUrl;
      if (cleanUrl.includes('?t=')) {
        cleanUrl = cleanUrl.split('?t=')[0];
        console.log('ImageLoader: URL limpa de timestamps:', cleanUrl);
      }

      console.log('ImageLoader: Tentando carregar URL:', cleanUrl);
      setLoading(true);
      setError(null);

      // Se for uma URL blob, usar diretamente
      if (cleanUrl.startsWith('blob:')) {
        console.log('ImageLoader: Usando URL blob');
        setSrc(cleanUrl);
        setLoading(false);
        return;
      }

      // Se a URL já foi carregada com sucesso antes e não estamos prevenindo cache
      if (!preventCache && successfulUrls.has(cleanUrl)) {
        console.log('ImageLoader: Usando URL do cache:', cleanUrl);
        setSrc(cleanUrl);
        setLoading(false);
        return;
      }

      try {
        // Para URLs públicas, adicionar timestamp para evitar cache
        const timestamp = Date.now();
        const urlWithTimestamp = preventCache 
          ? `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}t=${timestamp}`
          : cleanUrl;
        
        console.log('ImageLoader: URL para carregamento:', urlWithTimestamp);

        // Criar elemento de imagem para pré-carregamento
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";

        // Configurar promessa para carregar a imagem
        const loadPromise = new Promise<string>((resolve, reject) => {
          img.onload = () => {
            console.log('ImageLoader: Imagem carregada com sucesso:', urlWithTimestamp);
            successfulUrls.add(cleanUrl); // Adicionar ao cache
            resolve(urlWithTimestamp);
          };
          
          img.onerror = (e) => {
            console.error('ImageLoader: Erro ao carregar imagem:', e);
            reject(new Error('Erro ao carregar imagem'));
          };
          
          // Iniciar carregamento
          img.src = urlWithTimestamp;
        });

        // Configurar timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            img.src = ''; // Cancelar carregamento
            reject(new Error('Timeout ao carregar imagem'));
          }, timeout);
        });

        // Corrida entre carregamento e timeout
        const result = await Promise.race([loadPromise, timeoutPromise]);

        // Limpar timeout se a imagem carregou
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Atualizar estado se componente ainda está montado
        if (isMounted.current) {
          setSrc(result);
          setLoading(false);
          setError(null);
          setRetryCount(0); // Resetar contagem de tentativas em caso de sucesso
        }
      } catch (error) {
        console.error('ImageLoader: Erro ao carregar imagem:', error);
        
        // Tentar novamente se o componente ainda está montado
        if (isMounted.current) {
          if (retryCount < maxRetries) {
            console.log(`ImageLoader: Tentativa ${retryCount + 1} de ${maxRetries}`);
            setRetryCount(prev => prev + 1);
            
            // Tentar novamente após um pequeno atraso
            timeoutRef.current = setTimeout(() => {
              if (isMounted.current) {
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
  }, [imageUrl, retryCount, maxRetries, timeout, preventCache, refreshTrigger]);

  return { loading, error, src, retryCount, refresh };
}
