import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente para configuração ou valores fixos para demonstração
const supabaseUrl = 'https://yieihrvcbshzmxieflsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWlocnZjYnNoem14aWVmbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjU2MDYsImV4cCI6MjA1OTYwMTYwNn0.fOBINx1LP_fxvnboVkJEAYTI_GVcI9gzKBhVAqXPrsY';

// Criar uma única instância do cliente Supabase com configurações explícitas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  }
});

// Nome consistente do bucket para todo o aplicativo
export const AVATARS_BUCKET = 'avatars';

// Verificar se o bucket avatars existe
export async function checkBucketExists(): Promise<boolean> {
  try {
    console.log('Verificando se o bucket avatars existe...');
    
    // Primeiro, tenta acessar diretamente o bucket
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list();
    
    if (bucketError) {
      console.error('Erro ao acessar bucket:', bucketError);
      
      // Se o erro for de bucket não encontrado, tenta listar todos os buckets
      if (bucketError.message.includes('not found')) {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.error('Erro ao listar buckets:', listError);
          throw new Error('Erro ao listar buckets: ' + listError.message);
        }
        
        console.log('Buckets disponíveis:', buckets);
        const avatarsBucket = buckets?.find(bucket => bucket.name === AVATARS_BUCKET);
        
        if (!avatarsBucket) {
          console.error(`Bucket "${AVATARS_BUCKET}" não encontrado`);
          throw new Error('Bucket de avatares não encontrado. Por favor, crie o bucket "avatars" no seu projeto Supabase através do painel de controle.');
        }
      } else {
        throw new Error('Erro ao acessar bucket: ' + bucketError.message);
      }
    }
    
    console.log(`Bucket "${AVATARS_BUCKET}" acessível com sucesso`);
    return true;
  } catch (error) {
    console.error('Erro ao verificar bucket:', error);
    throw error;
  }
}

// Função centralizada para lidar com URLs de avatares
export function normalizeAvatarUrl(url: string | null): string {
  if (!url) return '';
  
  try {
    // Se já é uma URL completa
    if (url.startsWith('http')) {
      // Remover parâmetros de query
      const cleanUrl = url.split('?')[0];
      
      // Se já é uma URL pública do Supabase, retornar diretamente
      if (cleanUrl.includes('/storage/v1/object/public/')) {
        return cleanUrl;
      }
      
      // Se é uma URL do Supabase mas não pública, extrair o caminho
      if (cleanUrl.includes('supabase.co/storage')) {
        const urlParts = cleanUrl.split('/storage/v1/object/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          const { data } = supabase.storage
            .from(AVATARS_BUCKET)
            .getPublicUrl(filePath);
            
          return data?.publicUrl || '';
        }
      }
      
      return cleanUrl;
    }
    
    // Se é apenas um caminho de arquivo
    const cleanPath = url.replace(/^\/|\/$/g, '');
    const { data } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(cleanPath);
      
    return data?.publicUrl || '';
  } catch (error) {
    console.error('Erro ao normalizar URL do avatar:', error);
    return '';
  }
}

// Função para gerar URLs públicas de avatar
export function getAvatarPublicUrl(filePath: string): string {
  if (!filePath) return '';
  
  try {
    // Se já é uma URL completa, retorná-la limpa
    if (filePath.startsWith('http')) {
      // Remover possíveis parâmetros de query
      return filePath.split('?')[0];
    }
    
    // Remover barras iniciais e finais
    const cleanPath = filePath.replace(/^\/|\/$/g, '');
    
    // Usar o método do Supabase para obter a URL CDN pública
    const { data } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(cleanPath);
    
    console.log('URL pública gerada:', data.publicUrl);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao gerar URL pública:', error);
    throw new Error('Erro ao gerar URL pública: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Função para upload de arquivos que retorna uma URL pública
export async function uploadToAvatarsBucket(
  file: File, 
  filePath: string
): Promise<string> {
  try {
    // Verificar se o bucket existe
    await checkBucketExists();
    
    console.log(`Iniciando upload para ${AVATARS_BUCKET}/${filePath}`);
    
    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '0', // Sem cache
        upsert: true
      });
    
    if (error) {
      console.error('Erro no upload:', error);
      throw new Error('Erro no upload: ' + error.message);
    }
    
    console.log('Upload bem-sucedido:', data);
    
    // Retornar a URL pública
    return getAvatarPublicUrl(data.path);
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}
