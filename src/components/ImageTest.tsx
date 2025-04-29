
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ImageTestProps {
  imageUrl: string;
}

// Cache de imagens bem-sucedidas
const successfulUrls = new Set<string>();

export function ImageTest({ imageUrl }: ImageTestProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState(imageUrl);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Reset states when URL changes
    setLoading(true);
    setError(null);
    setRetryCount(0);
    
    // Assegurar que a URL não é nula ou vazia
    if (!imageUrl) {
      setError('URL de imagem não fornecida');
      setLoading(false);
      return;
    }
    
    setCurrentSrc(imageUrl);

    // Se a URL já foi carregada com sucesso antes, não precisa tentar novamente
    if (successfulUrls.has(imageUrl)) {
      setLoading(false);
      setError(null);
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
    console.log('Imagem carregada com sucesso:', currentSrc);
    successfulUrls.add(currentSrc);
  };

  const handleImageError = async (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Erro ao carregar imagem:', e);
    console.error('URL que falhou:', currentSrc);
    
    // Tentar diferentes variações da URL
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      let newUrl = currentSrc;

      // Primeira tentativa: remover parâmetros de query
      if (retryCount === 0 && currentSrc.includes('?')) {
        newUrl = currentSrc.split('?')[0];
        console.log('Tentativa 1: URL sem parâmetros:', newUrl);
      }
      // Segunda tentativa: usar URL com /public/
      else if (retryCount === 1 && !currentSrc.includes('/public/')) {
        // Substituir object por public na URL
        if (currentSrc.includes('/object/')) {
          newUrl = currentSrc.replace('/object/', '/public/');
          console.log('Tentativa 2: URL com /public/:', newUrl);
        }
      }
      // Terceira tentativa: adicionar timestamp para evitar cache
      else if (retryCount === 2) {
        newUrl = `${currentSrc}?t=${Date.now()}`;
        console.log('Tentativa 3: URL com timestamp:', newUrl);
      }

      if (newUrl !== currentSrc) {
        setCurrentSrc(newUrl);
        return;
      }
    }
    
    setLoading(false);
    setError('Erro ao carregar imagem');
    toast.error('Não foi possível carregar a imagem');
  };

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      )}
      {currentSrc && (
        <img
          src={currentSrc}
          alt="Avatar do usuário"
          className={`w-full h-full object-cover transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-20">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
