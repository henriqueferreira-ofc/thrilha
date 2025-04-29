import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ImageTestProps {
  imageUrl: string;
}

// Cache de URLs que já foram carregadas com sucesso
const successfulUrls = new Set<string>();

export function ImageTest({ imageUrl }: ImageTestProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [src, setSrc] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadImage = async () => {
      if (!imageUrl) {
        console.log('ImageTest: URL não fornecida');
        setError('URL de imagem não fornecida');
        setLoading(false);
        return;
      }

      console.log('ImageTest: Iniciando carregamento da URL:', imageUrl);
      setLoading(true);
      setError(null);

      // Se for uma URL blob, use diretamente
      if (imageUrl.startsWith('blob:')) {
        console.log('ImageTest: Usando URL blob');
        setSrc(imageUrl);
        setLoading(false);
        return;
      }

      // Se a URL já foi carregada com sucesso antes, use-a diretamente
      if (successfulUrls.has(imageUrl)) {
        console.log('ImageTest: Usando URL do cache:', imageUrl);
        setSrc(imageUrl);
        setLoading(false);
        return;
      }

      try {
        // Verificar se a URL é válida
        const response = await fetch(imageUrl, { 
          method: 'HEAD',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Verificar se o conteúdo é uma imagem
        const contentType = response.headers.get('content-type');
        if (!contentType?.startsWith('image/')) {
          throw new Error('O arquivo não é uma imagem válida');
        }

        // Para URLs públicas, adicionar timestamp para evitar cache
        const urlWithTimestamp = `${imageUrl}?t=${Date.now()}`;
        console.log('ImageTest: URL com timestamp:', urlWithTimestamp);

        const img = new Image();
        
        const loadPromise = new Promise((resolve, reject) => {
          img.onload = () => {
            console.log('ImageTest: Imagem carregada com sucesso');
            successfulUrls.add(imageUrl); // Adicionar ao cache
            resolve(urlWithTimestamp);
          };
          
          img.onerror = (e) => {
            console.error('ImageTest: Erro ao carregar imagem:', e);
            reject(new Error('Erro ao carregar imagem'));
          };
        });

        // Adicionar timeout para o carregamento
        timeoutId = setTimeout(() => {
          img.src = ''; // Cancela o carregamento
          reject(new Error('Timeout ao carregar imagem'));
        }, 10000); // 10 segundos de timeout

        img.src = urlWithTimestamp;
        await loadPromise;

        if (isMounted) {
          setSrc(urlWithTimestamp);
          setLoading(false);
          setError(null);
          setRetryCount(0); // Reset retry count on success
        }
      } catch (error) {
        console.error('ImageTest: Erro ao carregar imagem:', error);
        if (isMounted) {
          if (retryCount < maxRetries) {
            console.log(`ImageTest: Tentativa ${retryCount + 1} de ${maxRetries}`);
            setRetryCount(prev => prev + 1);
            // Tentar novamente após um pequeno delay
            setTimeout(() => {
              if (isMounted) {
                loadImage();
              }
            }, 1000 * (retryCount + 1)); // Delay crescente
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
      console.log('ImageTest: Limpando effect');
    };
  }, [imageUrl, retryCount]);

  if (loading) {
    console.log('ImageTest: Renderizando loader');
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !src) {
    console.log('ImageTest: Renderizando fallback, error:', error);
    return (
      <Avatar className="w-full h-full bg-gray-800">
        <AvatarFallback className="bg-gray-800 text-gray-400">
          <User className="w-1/2 h-1/2" />
        </AvatarFallback>
      </Avatar>
    );
  }

  console.log('ImageTest: Renderizando imagem com src:', src);
  return (
    <img
      src={src}
      alt="Avatar do usuário"
      className="w-full h-full object-cover"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={(e) => {
        console.error('ImageTest: Erro na tag img:', e);
        setError('Erro ao carregar imagem');
        setSrc('');
      }}
    />
  );
}
