
import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente para configuração ou valores fixos para demonstração
const supabaseUrl = 'https://yieihrvcbshzmxieflsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWlocnZjYnNoem14aWVmbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjU2MDYsImV4cCI6MjA1OTYwMTYwNn0.fOBINx1LP_fxvnboVkJEAYTI_GVcI9gzKBhVAqXPrsY';

// Criar uma única instância do cliente Supabase com configurações explícitas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Ativar para suportar callbacks de URL
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
    
    // Se o bucket existe, retornar true
    if (avatarsBucket) {
      console.log(`Bucket "${AVATARS_BUCKET}" já existe`);
      return true;
    }
    
    console.log(`Bucket "${AVATARS_BUCKET}" não encontrado`);
    // Não tentar criar o bucket aqui - isso requer permissões especiais
    return false;
  } catch (error) {
    console.error('Erro ao verificar bucket:', error);
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
    // Verificar se o bucket existe
    const bucketExists = await checkAndCreateAvatarsBucket();
    if (!bucketExists) {
      throw new Error('Bucket de avatares não está disponível');
    }
    
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
    const { data: urlData } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(data.path);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}
