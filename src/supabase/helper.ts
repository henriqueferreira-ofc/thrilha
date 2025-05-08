
import { supabase } from './client';

/**
 * Verifica se o perfil do usuário existe e cria um novo se não existir
 * @param userId ID do usuário autenticado
 * @param username Nome de usuário para o perfil (opcional)
 * @returns O perfil do usuário, existente ou recém-criado
 */
export async function getOrCreateProfile(userId: string, username?: string) {
  try {
    console.log(`Verificando perfil para usuário ${userId}`);
    
    // 1. Primeiro verificar se o perfil já existe
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil:', fetchError);
      // Não lanço erro para continuar com a lógica de fallback
    }
    
    // 2. Se o perfil existir, retorná-lo
    if (existingProfile) {
      console.log('Perfil existente encontrado:', existingProfile);
      return { profile: existingProfile, isNew: false };
    } else {
      console.log('Perfil não encontrado, criando novo');
    }
    
    // 3. Se não existir, criar um novo
    const userResponse = await supabase.auth.getUser();
    const defaultUsername = username || 
      userResponse?.data?.user?.email?.split('@')[0] || 
      `user_${userId.substring(0, 8)}`;
    
    // Perfil local como fallback
    const fallbackProfile = {
      id: userId,
      username: defaultUsername,
      avatar_url: null,
      updated_at: new Date().toISOString()
    };
    
    // 4. Tentar inserir o perfil diretamente
    try {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: defaultUsername,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
        console.log('Usando perfil fallback');
        return {
          profile: fallbackProfile,
          isNew: true,
          error: insertError
        };
      }
      
      if (newProfile) {
        console.log('Perfil criado com sucesso:', newProfile);
        return { profile: newProfile, isNew: true };
      }
    } catch (error) {
      console.error('Exceção ao inserir perfil:', error);
      console.log('Usando perfil fallback após exceção');
      return {
        profile: fallbackProfile,
        isNew: true,
        error
      };
    }
    
    // 5. Fallback final
    console.warn('Todas as tentativas de criar perfil falharam, usando fallback');
    return {
      profile: fallbackProfile,
      isNew: true,
      error: new Error('Todas as tentativas de criar perfil falharam')
    };
  } catch (error) {
    console.error('Erro geral ao verificar/criar perfil:', error);
    
    // Criar um perfil local como último recurso
    const tempUsername = username || `user_${userId.substring(0, 8)}`;
    return {
      profile: {
        id: userId,
        username: tempUsername,
        avatar_url: null,
        updated_at: new Date().toISOString()
      },
      isNew: true,
      error
    };
  }
}
