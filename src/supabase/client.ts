
import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente para configuração
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yieihrvcbshzmxieflsv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWlocnZjYnNoem14aWVmbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjU2MDYsImV4cCI6MjA1OTYwMTYwNn0.fOBINx1LP_fxvnboVkJEAYTI_GVcI9gzKBhVAqXPrsY';

// Criar uma única instância do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: localStorage
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  }
});

// Nome consistente do bucket para todo o aplicativo
export const AVATARS_BUCKET = 'avatars';

// Verificar se o bucket avatars existe e criar se não existir
export async function checkAndCreateAvatarsBucket() {
  try {
    console.log('Verificando se o bucket avatars existe...');
    
    // Verificar se o bucket existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Erro ao verificar buckets:', error);
      return false;
    }
    
    console.log('Buckets disponíveis:', buckets);
    const avatarsBucket = buckets?.find(bucket => bucket.name === AVATARS_BUCKET);
    
    // Se o bucket não existir, tentar criá-lo
    if (!avatarsBucket) {
      console.log(`Bucket "${AVATARS_BUCKET}" não encontrado, tentando criar...`);
      try {
        const { data, error: createError } = await supabase.storage.createBucket(AVATARS_BUCKET, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024 // 5MB limite
        });
        
        if (createError) {
          console.error(`Erro ao criar bucket ${AVATARS_BUCKET}:`, createError);
          return false;
        }
        
        console.log(`Bucket "${AVATARS_BUCKET}" criado com sucesso`);
        return true;
      } catch (e) {
        console.error('Exceção ao criar bucket:', e);
        return false;
      }
    }
    
    console.log(`Bucket "${AVATARS_BUCKET}" já existe`);
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar bucket:', error);
    return false;
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
    return filePath; // Retornar a original se houver erro
  }
}

// Função para upload de arquivos que retorna uma URL pública
export async function uploadToAvatarsBucket(
  file: File, 
  filePath: string
): Promise<string> {
  try {
    // Assegurar que o bucket existe
    await checkAndCreateAvatarsBucket();
    
    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '0', // Sem cache
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Retornar a URL pública
    return getAvatarPublicUrl(data.path);
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}
