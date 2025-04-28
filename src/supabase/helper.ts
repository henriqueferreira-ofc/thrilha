import { supabase } from './client';

/**
 * Verifica se o perfil do usuário existe e cria um novo se não existir
 * @param userId ID do usuário autenticado
 * @param username Nome de usuário para o perfil (optional)
 * @returns O perfil do usuário, existente ou recém-criado
 */
export async function getOrCreateProfile(userId: string, username?: string) {
  try {
    // 1. Primeiro verificar se o perfil já existe
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Erro ao buscar perfil:', fetchError);
      // Não lançamos erro aqui para continuar a lógica de fallback
    }
    
    // 2. Se o perfil existir, retorná-lo
    if (existingProfile) {
      console.log('Perfil existente encontrado:', existingProfile);
      return { profile: existingProfile, isNew: false };
    }
    
    // 3. Se não existir, determinar o nome de usuário padrão
    const userResponse = await supabase.auth.getUser();
    const defaultUsername = username || 
      userResponse?.data?.user?.email?.split('@')[0] || 
      `user_${userId.substring(0, 8)}`;
    
    // Perfil local como fallback em caso de erros
    const fallbackProfile = {
      id: userId,
      username: defaultUsername,
      avatar_url: null,
      updated_at: new Date().toISOString()
    };
      
    // 4. Tentar criar o perfil usando metadados do usuário
    try {
      // Atualizar metadados do usuário primeiro, que não têm RLS
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: defaultUsername,
          full_name: defaultUsername
        }
      });
      
      if (updateError) {
        console.error('Erro ao atualizar metadados do usuário:', updateError);
        // Continuar com tentativas alternativas
      }
      
      // 5. Tentar criar usando função de admin (se disponível)
      try {
        const { data: newProfile, error: insertError } = await supabase.rpc('create_user_profile', {
          user_id: userId,
          user_name: defaultUsername
        });
        
        if (insertError) {
          console.warn('Erro ao criar perfil via RPC:', insertError);
          // Não lançamos erro para continuar com outras tentativas
        } else if (newProfile) {
          console.log('Perfil criado com sucesso via RPC:', newProfile);
          return { profile: newProfile, isNew: true };
        }
      } catch (rpcError) {
        console.warn('Função RPC para criar perfil não disponível:', rpcError);
        // Se RPC falhar, continuamos para tentar inserção direta
      }
      
      // 6. Tentar inserção direta como último recurso
      try {
        const { data: directProfile, error: directError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: defaultUsername,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (directError) {
          console.error('Erro ao criar perfil via inserção direta:', directError);
          return {
            profile: fallbackProfile,
            isNew: true,
            error: directError
          };
        }
        
        if (directProfile) {
          console.log('Perfil criado com sucesso via inserção direta:', directProfile);
          return { profile: directProfile, isNew: true };
        }
      } catch (insertError) {
        console.error('Exceção ao inserir perfil:', insertError);
        return {
          profile: fallbackProfile,
          isNew: true,
          error: insertError
        };
      }
      
      // 7. Fallback final se nenhuma operação retornou ou falhou explicitamente
      console.warn('Todas as tentativas de criar perfil falharam silenciosamente, usando fallback');
      return {
        profile: fallbackProfile,
        isNew: true,
        error: new Error('Todas as tentativas de criar perfil falharam')
      };
    } catch (error) {
      console.error('Erro não tratado ao criar perfil:', error);
      
      // 8. Em caso de erro, retornar perfil falso para interface não quebrar
      return {
        profile: fallbackProfile,
        isNew: true,
        error
      };
    }
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