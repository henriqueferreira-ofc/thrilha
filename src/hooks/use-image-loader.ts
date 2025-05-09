
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const refresh = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setRefreshTrigger(prev => prev + 1);
    setRetryCount(0);
    setError(null);
    setLoading(true);
    console.log('ImageLoader: Refreshing image...');
  };

  // Limpar recursos ao desmontar
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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
    
    // Cancelar requisições anteriores
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    const loadImage = async () => {
      // Verificar se tem URL
      if (!imageUrl) {
        console.log('ImageLoader: URL não fornecida');
        setError('URL de imagem não fornecida');
        setLoading(false);
        return;
      }

      // Obter URL base sem parâmetros
      let baseUrl = imageUrl;
      if (baseUrl.includes('?')) {
        baseUrl = baseUrl.split('?')[0];
      }

      console.log('ImageLoader: Tentando carregar URL:', imageUrl);
      setLoading(true);
      setError(null);

      // Se for uma URL blob, usar diretamente
      if (imageUrl.startsWith('blob:')) {
        console.log('ImageLoader: Usando URL blob');
        setSrc(imageUrl);
        setLoading(false);
        return;
      }

      try {
        // Criar elemento de imagem para pré-carregamento
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";

        // Configurar promessa para carregar a imagem
        const loadPromise = new Promise<string>((resolve, reject) => {
          img.onload = () => {
            console.log('ImageLoader: Imagem carregada com sucesso');
            if (baseUrl) successfulUrls.add(baseUrl); // Adicionar URL base ao cache
            resolve(imageUrl);
          };
          
          img.onerror = (e) => {
            console.error('ImageLoader: Erro ao carregar imagem:', e);
            reject(new Error('Erro ao carregar imagem'));
          };
          
          // Iniciar carregamento
          img.src = imageUrl;
        });

        // Configurar timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            img.src = ''; // Cancelar carregamento
            reject(new Error('Timeout ao carregar imagem'));
          }, timeout);
        });

        // Promessa de cancelamento
        const abortPromise = new Promise<never>((_, reject) => {
          const { signal } = abortControllerRef.current as AbortController;
          signal.addEventListener('abort', () => {
            reject(new Error('Carregamento de imagem cancelado'));
          });
        });

        // Corrida entre carregamento, timeout e cancelamento
        const result = await Promise.race([loadPromise, timeoutPromise, abortPromise]);

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
      } catch (error: any) {
        if (!isMounted.current) return;
        
        if (error.name === 'AbortError' || error.message === 'Carregamento de imagem cancelado') {
          console.log('ImageLoader: Carregamento cancelado');
          return;
        }
        
        console.error('ImageLoader: Erro ao carregar imagem:', error);
        
        // Tentar novamente se o componente ainda está montado
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
          setError('Erro ao carregar imagem após várias tentativas');
          setSrc('');
        }
      }
    };

    loadImage();
  }, [imageUrl, refreshTrigger, maxRetries, timeout, preventCache]);

  return { loading, error, src, retryCount, refresh };
}
