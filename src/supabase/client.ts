
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yieihrvcbshzmxieflsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWlocnZjYnNoem14aWVmbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjU2MDYsImV4cCI6MjA1OTYwMTYwNn0.fOBINx1LP_fxvnboVkJEAYTI_GVcI9gzKBhVAqXPrsY';

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
    // Verificar se o bucket existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Erro ao verificar buckets:', error);
      return false;
    }
    
    const avatarsBucket = buckets?.find(bucket => bucket.name === AVATARS_BUCKET);
    
    // Se o bucket não existir, tentar criá-lo
    if (!avatarsBucket) {
      console.log(`Bucket "${AVATARS_BUCKET}" não encontrado, tentando criar...`);
      const { data, error: createError } = await supabase.storage.createBucket(AVATARS_BUCKET, {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024 // 2MB limite
      });
      
      if (createError) {
        console.error(`Erro ao criar bucket ${AVATARS_BUCKET}:`, createError);
        return false;
      }
      
      console.log(`Bucket "${AVATARS_BUCKET}" criado com sucesso`);
      return true;
    }
    
    console.log(`Bucket "${AVATARS_BUCKET}" já existe`);
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar bucket:', error);
    return false;
  }
}

// Função auxiliar para gerar URLs públicas de avatar
export function getAvatarPublicUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}
