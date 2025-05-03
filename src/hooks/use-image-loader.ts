import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

interface UseImageLoaderOptions {
  maxRetries?: number;
  timeout?: number;
  fallbackUrl?: string;
}

interface UseImageLoaderResult {
  src: string;
  loading: boolean;
  error: string | null;
}

// Função para limpar a URL de parâmetros de query
function cleanUrl(url: string): string {
  return url.split('?')[0];
}

// Função para verificar se a URL parece ser uma resposta de upload
function isUploadResponse(url: string): boolean {
  return url.includes('WebKitFormBoundary') || url.includes('Content-Disposition: form-data');
}

// Função para extrair o caminho do arquivo da URL
function extractFilePath(url: string): string {
  // Se a URL já for uma URL pública do Supabase, extrair o caminho
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    const parts = url.split('/public/');
    const path = parts[1]?.split('?')[0] || url; // Remove query params
    // Remover 'avatars/' se estiver duplicado
    return path.replace(/^avatars\//, '');
  }

  // Se for um caminho direto do upload, remover 'avatars/' se presente
  if (url.startsWith('avatars/')) {
    return url.replace('avatars/', '');
  }

  // Se for um caminho completo, extrair a parte após 'avatars/'
  const parts = url.split('/avatars/');
  return parts[1]?.split('?')[0] || url; // Remove query params
}

// Função para verificar se o bucket existe
async function checkBucketExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .listBuckets();

    if (error) {
      console.error('ImageLoader: Erro ao verificar buckets:', error);
      return false;
    }

    const bucketExists = data?.some(bucket => bucket.name === 'avatars') ?? false;
    
    console.log('ImageLoader: Verificação de bucket:', {
      exists: bucketExists,
      buckets: data?.map(b => b.name)
    });

    return bucketExists;
  } catch (error) {
    console.error('ImageLoader: Erro ao verificar buckets:', error);
    return false;
  }
}

// Função para verificar se o arquivo existe no bucket
async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    // Primeiro, verificar se o bucket existe
    const bucketExists = await checkBucketExists();
    if (!bucketExists) {
      console.error('ImageLoader: Bucket de avatares não encontrado');
      return false;
    }

    // Extrair o diretório do usuário (primeira parte do caminho)
    const userDir = filePath.split('/')[0];
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .list(userDir);

    if (error) {
      console.error('ImageLoader: Erro ao verificar arquivo:', error);
      return false;
    }

    const fileName = filePath.split('/').pop();
    const exists = data?.some(file => file.name === fileName) ?? false;

    console.log('ImageLoader: Verificação de arquivo:', {
      filePath,
      userDir,
      fileName,
      exists,
      files: data
    });

    return exists;
  } catch (error) {
    console.error('ImageLoader: Erro ao verificar arquivo:', error);
    return false;
  }
}

// Função para verificar se o arquivo foi corretamente carregado
async function verifyFileUpload(filePath: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Primeiro, verificar se o arquivo existe
    const exists = await checkFileExists(filePath);
    if (!exists) {
      return { isValid: false, error: 'Arquivo não encontrado no bucket' };
    }

    // Tentar baixar o arquivo para verificar seu conteúdo
    const { data, error } = await supabase.storage
      .from('avatars')
      .download(filePath);

    if (error) {
      return { isValid: false, error: `Erro ao verificar arquivo: ${error.message}` };
    }

    if (!data) {
      return { isValid: false, error: 'Nenhum dado retornado ao verificar arquivo' };
    }

    // Verificar se o tamanho do arquivo é válido
    if (data.size === 0) {
      return { isValid: false, error: 'Arquivo vazio' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('ImageLoader: Erro ao verificar upload:', {
      error,
      filePath,
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return { isValid: false, error: error instanceof Error ? error.message : 'Erro ao verificar upload' };
  }
}

// Função para obter a URL pública do Supabase
async function getSupabasePublicUrl(filePath: string): Promise<string> {
  try {
    // Se a URL já for uma URL pública do Supabase, retornar diretamente
    if (filePath.includes('supabase.co/storage/v1/object/public/')) {
      return cleanUrl(filePath);
    }

    // Extrair o caminho do arquivo e garantir que não haja duplicação
    const path = extractFilePath(filePath);
    
    // Verificar se o arquivo existe
    const exists = await checkFileExists(path);
    if (!exists) {
      throw new Error('Arquivo não encontrado no bucket');
    }
    
    // Obter URL pública usando o método getPublicUrl do Supabase
    const { data } = await supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error('URL pública não gerada');
    }

    console.log('ImageLoader: URL pública gerada:', {
      originalPath: filePath,
      extractedPath: path,
      publicUrl: data.publicUrl
    });

    // Garantir que a URL pública não tenha parâmetros de query
    return cleanUrl(data.publicUrl);
  } catch (error) {
    console.error('ImageLoader: Erro ao obter URL pública:', {
      error,
      filePath,
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    throw error;
  }
}

// Função para verificar se a URL é acessível e retornar o tipo de conteúdo
async function checkImageAccessibility(url: string): Promise<{ accessible: boolean; contentType: string | null; errorDetails?: string }> {
  try {
    // Primeiro, verificar se o bucket existe
    const bucketExists = await checkBucketExists();
    if (!bucketExists) {
      console.error('ImageLoader: Bucket de avatares não encontrado');
      return {
        accessible: false,
        contentType: null,
        errorDetails: 'Bucket de avatares não encontrado. Por favor, crie o bucket "avatars" no seu projeto Supabase.'
      };
    }

    // Extrair o caminho do arquivo
    const path = extractFilePath(url);
    console.log('ImageLoader: Verificando acessibilidade do arquivo:', { path });

    // Verificar se o arquivo existe
    const exists = await checkFileExists(path);
    if (!exists) {
      console.error('ImageLoader: Arquivo não encontrado:', { path });
      return {
        accessible: false,
        contentType: null,
        errorDetails: 'Arquivo não encontrado no bucket. Verifique se o arquivo foi enviado corretamente.'
      };
    }

    // Obter URL pública
    const publicUrl = await getSupabasePublicUrl(path);

    // Verificar se a URL é acessível fazendo uma requisição HEAD
    const response = await fetch(publicUrl, { method: 'HEAD' });
    
    if (!response.ok) {
      // Se a resposta for JSON, tentar ler o conteúdo para diagnóstico
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonError = await response.json();
        console.error('ImageLoader: Resposta JSON de erro:', {
          url: publicUrl,
          status: response.status,
          error: jsonError
        });
        return {
          accessible: false,
          contentType: null,
          errorDetails: `Erro ao acessar imagem: ${JSON.stringify(jsonError)}`
        };
      }

      console.error('ImageLoader: URL não acessível:', {
        url: publicUrl,
        status: response.status,
        statusText: response.statusText
      });
      return {
        accessible: false,
        contentType: null,
        errorDetails: `URL não acessível: ${response.status} ${response.statusText}`
      };
    }

    // Verificar o content-type da resposta
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      console.error('ImageLoader: Tipo de conteúdo inválido:', {
        url: publicUrl,
        contentType
      });
      return {
        accessible: false,
        contentType: null,
        errorDetails: `Tipo de conteúdo inválido: ${contentType}`
      };
    }

    console.log('ImageLoader: URL acessível:', {
      url: publicUrl,
      status: response.status,
      contentType
    });

    return {
      accessible: true,
      contentType,
      errorDetails: undefined
    };
  } catch (error) {
    console.error('ImageLoader: Erro ao verificar acessibilidade:', {
      error,
      url,
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return {
      accessible: false,
      contentType: null,
      errorDetails: error instanceof Error ? error.message : 'Erro desconhecido ao verificar acessibilidade'
    };
  }
}

// Função para carregar a imagem
async function loadImage(url: string): Promise<string> {
  try {
    // Extrair o caminho do arquivo
    const path = extractFilePath(url);
    console.log('ImageLoader: Carregando arquivo:', { path });

    // Verificar se o arquivo existe
    const exists = await checkFileExists(path);
    if (!exists) {
      throw new Error('Arquivo não encontrado no bucket');
    }

    // Obter URL pública
    const publicUrl = await getSupabasePublicUrl(path);

    console.log('ImageLoader: Imagem carregada com sucesso:', {
      path,
      publicUrl
    });

    return publicUrl;
  } catch (error) {
    console.error('ImageLoader: Erro ao carregar imagem:', {
      error,
      url,
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    throw error;
  }
}

// Função principal do hook
export function useImageLoader(
  imageUrl: string | null,
  options: UseImageLoaderOptions = {}
): UseImageLoaderResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [src, setSrc] = useState('');
  const maxRetries = options.maxRetries ?? 3;
  const timeout = options.timeout ?? 60000; // 60 segundos
  const fallbackUrl = options.fallbackUrl ?? '/default-avatar.png';

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadImageAsync = async () => {
      if (!imageUrl) {
        console.log('ImageLoader: URL não fornecida, usando fallback');
        setSrc(fallbackUrl);
        setLoading(false);
        return;
      }

      try {
        // Limpar a URL de parâmetros de query
        const cleanImageUrl = cleanUrl(imageUrl);
        console.log('ImageLoader: URL limpa:', {
          original: imageUrl,
          cleaned: cleanImageUrl
        });

        // Verificar acessibilidade
        const { accessible, errorDetails } = await checkImageAccessibility(cleanImageUrl);
        if (!accessible) {
          console.error('ImageLoader: URL não acessível:', {
            url: cleanImageUrl,
            error: errorDetails
          });
          
          setError(errorDetails || 'Imagem não acessível');
          setSrc(fallbackUrl);
          setLoading(false);
          return;
        }

        // Carregar a imagem
        const publicUrl = await loadImage(cleanImageUrl);
        
        if (isMounted) {
          setSrc(publicUrl);
          setLoading(false);
          setError(null);
        }
      } catch (error) {
        if (isMounted) {
          console.error('ImageLoader: Erro ao carregar imagem:', error);
          setError(error instanceof Error ? error.message : 'Erro ao carregar imagem');
          setSrc(fallbackUrl);
          setLoading(false);
        }
      }
    };

    loadImageAsync();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [imageUrl, timeout, maxRetries, fallbackUrl]);

  return { loading, error, src };
}
