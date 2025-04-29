import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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