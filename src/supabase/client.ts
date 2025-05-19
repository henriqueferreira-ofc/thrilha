
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase connection
const supabaseUrl = "https://yieihrvcbshzmxieflsv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZWlocnZjYnNoem14aWVmbHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjU2MDYsImV4cCI6MjA1OTYwMTYwNn0.fOBINx1LP_fxvnboVkJEAYTI_GVcI9gzKBhVAqXPrsY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AVATARS_BUCKET = 'avatars';

export async function getAvatarPublicUrl(filePath: string): Promise<string> {
  try {
    const { data } = supabase
      .storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Não foi possível gerar a URL pública');
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao gerar URL pública:', error);
    throw error;
  }
}

// Função para verificar se o bucket existe
export async function checkBucketExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .storage
      .getBucket(AVATARS_BUCKET);
    
    if (error) {
      console.error('Bucket não existe ou erro ao verificar:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Erro ao verificar bucket:', error);
    return false;
  }
}
