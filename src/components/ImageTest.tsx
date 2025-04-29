
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { AVATARS_BUCKET } from '../supabase/client';

interface ImageTestProps {
  imageUrl: string;
}

// Cache de imagens bem-sucedidas
const successfulUrls = new Set<string>();

export function ImageTest({ imageUrl }: ImageTestProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState('');
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
    
    console.log('ImageTest recebeu URL:', imageUrl);
    
    // Verificar se a URL está utilizando o nome correto do bucket
    let updatedUrl = imageUrl;
    
    // Usar o nome correto do bucket (avatars)
    if (updatedUrl.includes('/avatares/')) {
      updatedUrl = updatedUrl.replace('/avatares/', `/${AVATARS_BUCKET}/`);
      console.log('URL corrigida (nome do bucket):', updatedUrl);
    }
    
    // Se a URL contém parâmetros de query, remova-os para evitar problemas de cache
    if (updatedUrl.includes('?')) {
      updatedUrl = updatedUrl.split('?')[0];
      console.log('URL sem parâmetros:', updatedUrl);
    }
    
    // Certificar que a URL usa /public/ para acesso público
    if (updatedUrl.includes('/object/') && !updatedUrl.includes('/public/')) {
      updatedUrl = updatedUrl.replace('/object/', '/public/');
      console.log('URL corrigida (usando /public/):', updatedUrl);
    } else if (!updatedUrl.includes('/public/') && updatedUrl.includes(`/${AVATARS_BUCKET}/`)) {
      const urlParts = updatedUrl.split(`/${AVATARS_BUCKET}/`);
      if (urlParts.length === 2) {
        updatedUrl = `${urlParts[0]}/public/${AVATARS_BUCKET}/${urlParts[1]}`;
        console.log('URL corrigida (adicionando /public/):', updatedUrl);
      }
    }

    // Adicionar parâmetro para contornar o cache
    const timestamp = Date.now();
    updatedUrl = `${updatedUrl}?nocache=${timestamp}`;
    console.log('URL final para carregar:', updatedUrl);
    
    setCurrentSrc(updatedUrl);
    
    // Se a URL já foi carregada com sucesso antes, não precisa tentar novamente
    if (successfulUrls.has(updatedUrl.split('?')[0])) {
      console.log('URL já carregada anteriormente com sucesso');
      setLoading(false);
      setError(null);
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
    console.log('Imagem carregada com sucesso:', currentSrc);
    // Armazenar a URL base (sem parâmetros) no cache
    const baseUrl = currentSrc.split('?')[0];
    successfulUrls.add(baseUrl);
  };

  const handleImageError = async () => {
    console.error('Erro ao carregar imagem:', currentSrc);
    
    // Tentar diferentes variações da URL
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      let newUrl = currentSrc;

      if (retryCount === 0) {
        // Primeira tentativa: tentar URL com formato alternativo de caminho
        if (newUrl.includes('/storage/v1/')) {
          if (!newUrl.includes('/public/')) {
            newUrl = newUrl.replace('/storage/v1/', '/storage/v1/public/');
            console.log('Tentativa 1: URL com formato alternativo:', newUrl);
          }
        }
      } 
      else if (retryCount === 1) {
        // Segunda tentativa: tentar URL com caminho direto
        const baseUrl = 'https://yieihrvcbshzmxieflsv.supabase.co';
        const path = currentSrc.split('/storage/')[1]?.split('?')[0];
        if (path) {
          newUrl = `${baseUrl}/storage/v1/object/public/${path}?t=${Date.now()}`;
          console.log('Tentativa 2: URL com caminho direto:', newUrl);
        }
      }
      else if (retryCount === 2) {
        // Terceira tentativa: usar CDN do Supabase se disponível
        const cdnUrl = 'https://yieihrvcbshzmxieflsv.supabase.co/storage/v1/object/public/';
        const path = imageUrl.split('/avatars/')[1];
        if (path) {
          newUrl = `${cdnUrl}avatars/${path}?t=${Date.now()}`;
          console.log('Tentativa 3: URL via CDN:', newUrl);
        }
      }

      if (newUrl !== currentSrc) {
        setCurrentSrc(newUrl);
        return;
      }
    }
    
    setLoading(false);
    setError('Erro ao carregar imagem');
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
        <Avatar className="w-full h-full bg-gray-800">
          <AvatarFallback className="bg-gray-800 text-gray-400">
            <User className="w-1/2 h-1/2" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
