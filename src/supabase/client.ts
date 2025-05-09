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
    
    // Verificar se o bucket existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Erro ao verificar buckets:', error);
      throw new Error('Erro ao verificar buckets: ' + error.message);
    }
    
    console.log('Buckets disponíveis:', buckets);
    const avatarsBucket = buckets?.find(bucket => bucket.name === AVATARS_BUCKET);
    
    if (!avatarsBucket) {
      console.error(`Bucket "${AVATARS_BUCKET}" não encontrado`);
      throw new Error('Bucket de avatares não encontrado. Por favor, crie o bucket "avatars" no seu projeto Supabase através do painel de controle.');
    }
    
    console.log(`Bucket "${AVATARS_BUCKET}" encontrado`);
    return true;
  } catch (error) {
    console.error('Erro ao verificar bucket:', error);
    throw error;
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
