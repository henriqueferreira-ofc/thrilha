import { getSupabaseClient } from '@/lib/supabase';

export async function verificarBucket() {
  const supabase = getSupabaseClient();
  
  try {
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();

    if (error) {
      console.error('Erro ao listar buckets:', error);
      return false;
    }

    const avatarBucket = buckets?.find(b => b.name === 'avatars');
    
    if (!avatarBucket) {
      console.warn('Criando bucket avatars...');
      const { error: createError } = await supabase
        .storage
        .createBucket('avatars', { public: true });

      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        return false;
      }
    }

    return true;
  } catch (erro) {
    console.error('Erro ao verificar bucket:', erro);
    return false;
  }
}