
import { supabase } from '@/supabase/client';

export async function verificarBucket() {
  try {
    // Verifica se o bucket existe
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();

    if (error) throw error;

    const bucketAvatars = buckets?.find(b => b.name === 'avatars');
    
    if (!bucketAvatars) {
      // Cria o bucket se não existir
      const { error: createError } = await supabase
        .storage
        .createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
        });

      if (createError) throw createError;
    }

    // Configura as políticas do bucket
    const { error: policyError } = await supabase.rpc('criar_politicas_avatar');
    if (policyError) console.error('Erro ao configurar políticas:', policyError);

  } catch (erro) {
    console.error('Erro ao verificar bucket:', erro);
  }
}
