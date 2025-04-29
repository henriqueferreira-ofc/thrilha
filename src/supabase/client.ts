
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

// Verificar se o bucket avatares existe e criar se não existir
export async function checkAndCreateAvatarsBucket() {
  try {
    // Verificar se o bucket existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Erro ao verificar buckets:', error);
      return false;
    }
    
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatares');
    
    // Se o bucket não existir, tentar criá-lo
    if (!avatarsBucket) {
      console.log('Bucket "avatares" não encontrado, tentando criar...');
      const { data, error: createError } = await supabase.storage.createBucket('avatares', {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024 // 2MB limite
      });
      
      if (createError) {
        console.error('Erro ao criar bucket avatares:', createError);
        return false;
      }
      
      console.log('Bucket "avatares" criado com sucesso');
      return true;
    }
    
    console.log('Bucket "avatares" já existe');
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar bucket:', error);
    return false;
  }
}
