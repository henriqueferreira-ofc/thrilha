
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
      'Cache-Control': 'no-cache',
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
        
        // Definir políticas de acesso público para o bucket recém-criado
        try {
          await definePublicBucketPolicy();
          console.log('Políticas de acesso público aplicadas com sucesso');
        } catch (policyError) {
          console.error('Erro ao definir políticas de acesso:', policyError);
        }
        
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

// Função para definir políticas de acesso público para o bucket
async function definePublicBucketPolicy() {
  try {
    // Política para permitir leitura pública (SELECT)
    const { error: selectError } = await supabase.rpc('create_storage_policy', {
      bucket_id: AVATARS_BUCKET,
      name: 'Public Read Access',
      definition: 'true', // Qualquer um pode ler
      operation: 'SELECT',
      actions: ['SELECT']
    });
    
    if (selectError) {
      console.warn('Erro ao definir política SELECT:', selectError);
    }
    
    // Política para permitir que usuários autenticados façam upload (INSERT)
    const { error: insertError } = await supabase.rpc('create_storage_policy', {
      bucket_id: AVATARS_BUCKET,
      name: 'Authenticated Insert Access',
      definition: 'auth.role() = \'authenticated\'', // Apenas usuários autenticados
      operation: 'INSERT',
      actions: ['INSERT']
    });
    
    if (insertError) {
      console.warn('Erro ao definir política INSERT:', insertError);
    }
  } catch (error) {
    console.error('Erro ao definir políticas:', error);
    throw error;
  }
}

// Função auxiliar para gerar URLs públicas de avatar
export function getAvatarPublicUrl(filePath: string): string {
  if (!filePath) return '';
  
  // Limpeza básica do caminho
  const cleanPath = filePath.replace(/^\/|\/$/g, '');
  
  try {
    // Se já é uma URL completa, retorná-la limpa
    if (filePath.startsWith('http')) {
      return filePath.split('?')[0];
    }
    
    // Gerar URL direta (não API) para garantir acesso público
    const { data } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(cleanPath);
    
    console.log('URL pública gerada:', data.publicUrl);
    
    // Garantir que a URL use o formato public para acesso direto
    let publicUrl = data.publicUrl;
    if (!publicUrl.includes('/public/')) {
      publicUrl = publicUrl.replace('/object/', '/public/');
    }
    
    return publicUrl;
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
        cacheControl: '3600',
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
