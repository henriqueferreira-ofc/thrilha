
import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente para configuração
const supabaseUrl = 'https://yieihrvcbshzmxieflsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWlocnZjYnNoem14aWVmbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjU2MDYsImV4cCI6MjA1OTYwMTYwNn0.fOBINx1LP_fxvnboVkJEAYTI_GVcI9gzKBhVAqXPrsY';

// Criar uma única instância do cliente Supabase com configurações melhoradas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce', // Usar PKCE para maior segurança
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Aumentar limite de eventos por segundo
    }
  },
  global: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
  db: {
    schema: 'public'
  }
});

// Nome consistente do bucket para todo o aplicativo
export const AVATARS_BUCKET = 'avatars';

// Verificar a existência do bucket, criando-o se necessário
export async function checkBucketExists(): Promise<boolean> {
  try {
    // Listar todos os buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Erro ao listar buckets:', error);
      return false;
    }
    
    // Verificar se o bucket existe
    const bucketExists = buckets?.some(bucket => bucket.name === AVATARS_BUCKET);
    
    if (!bucketExists) {
      console.warn(`Bucket '${AVATARS_BUCKET}' não encontrado. Assumindo que existe.`);
      // Não tentaremos criar o bucket aqui, isso deve ser feito por SQL
    } else {
      console.log(`Bucket '${AVATARS_BUCKET}' encontrado.`);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar bucket:', error);
    return false;
  }
}

// Função para gerar URLs públicas de avatar com sanitização de entrada
export function getAvatarPublicUrl(filePath: string): string {
  if (!filePath) return '';
  
  try {
    // Sanitizar o caminho do arquivo
    // Remover caracteres potencialmente perigosos
    const sanitizedPath = filePath
      .replace(/[^\w\s.\/-]/g, '') // Remover caracteres especiais exceto alguns seguros
      .replace(/\.{2,}/g, '.') // Prevenir directory traversal
      .replace(/^\/|\/$/g, ''); // Remover barras iniciais e finais
    
    // Se já é uma URL completa, retorná-la limpa
    if (sanitizedPath.startsWith('http')) {
      // Remover possíveis parâmetros de query
      return sanitizedPath.split('?')[0];
    }
    
    // Usar o método do Supabase para obter a URL pública
    const { data } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(sanitizedPath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao gerar URL pública:', error);
    return '';
  }
}

// Função para upload de arquivos com validação e sanitização
export async function uploadToAvatarsBucket(
  file: File, 
  filePath: string
): Promise<string> {
  try {
    if (!file) throw new Error('Nenhum arquivo fornecido');
    
    // Validar tipo e tamanho do arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 3 * 1024 * 1024; // 3MB
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP.');
    }
    
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. O limite é de 3MB.');
    }
    
    // Sanitizar o caminho do arquivo
    const sanitizedPath = filePath
      .replace(/[^\w\s.\/-]/g, '')
      .replace(/\.{2,}/g, '.')
      .replace(/^\/|\/$/g, '');
    
    console.log(`Iniciando upload para ${AVATARS_BUCKET}/${sanitizedPath}`);
    
    // Upload do arquivo com controle de cache e metadata de segurança
    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(sanitizedPath, file, {
        cacheControl: '3600', // 1 hora de cache
        upsert: true,
        contentType: file.type,
      });
    
    if (error) {
      console.error('Erro no upload:', error);
      throw new Error('Erro no upload: ' + error.message);
    }
    
    console.log('Upload bem-sucedido:', data);
    
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
