
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/supabase/client';
import { User } from '@supabase/supabase-js';

interface Collaborator {
  id: string;
  user_id: string;
  task_id: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export function useTaskCollaborators(currentUser?: User | null) {
  const [loading, setLoading] = useState(false);

  // Adicionar um colaborador a uma tarefa
  const addCollaborator = async (taskId: string, userEmail: string): Promise<boolean> => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para adicionar colaboradores');
      return false;
    }
    
    setLoading(true);

    try {
      // Extract username from email (remove domain part)
      const username = userEmail.split('@')[0];
      
      console.log('Procurando usuário com username:', username);
      
      // Buscar o ID do usuário pelo username
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        toast.error('Usuário não encontrado. Verifique o email informado.');
        return false;
      }

      if (!userData) {
        toast.error('Usuário não encontrado com esse email.');
        return false;
      }

      const collaboratorId = userData.id;
      console.log('ID do colaborador encontrado:', collaboratorId);

      // Verificar se o usuário já é colaborador
      const { data: existingCollaborators, error: checkError } = await supabase
        .from('task_collaborators')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', collaboratorId);

      if (checkError) {
        console.error('Erro ao verificar colaborador existente:', checkError);
        throw checkError;
      }

      if (existingCollaborators && existingCollaborators.length > 0) {
        toast.info('Este usuário já é colaborador desta tarefa');
        return false;
      }

      // Adicionar o colaborador
      const { error } = await supabase
        .from('task_collaborators')
        .insert({
          task_id: taskId,
          user_id: collaboratorId
        });

      if (error) {
        console.error('Erro ao adicionar colaborador:', error);
        throw error;
      }

      toast.success('Colaborador adicionado com sucesso!');
      return true;
    } catch (error: unknown) {
      console.error('Erro ao adicionar colaborador:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar colaborador');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remover um colaborador de uma tarefa
  const removeCollaborator = async (taskId: string, userId: string): Promise<boolean> => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para remover colaboradores');
      return false;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('task_collaborators')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Colaborador removido com sucesso!');
      return true;
    } catch (error: unknown) {
      console.error('Erro ao remover colaborador:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao remover colaborador');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar colaboradores de uma tarefa
  const getTaskCollaborators = async (taskId: string) => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para ver colaboradores');
      return [];
    }
    
    setLoading(true);

    try {
      // Usar uma query simples para buscar os colaboradores e depois buscar os detalhes dos usuários
      const { data: collaboratorsData, error: collaboratorsError } = await supabase
        .from('task_collaborators')
        .select('*')
        .eq('task_id', taskId);

      if (collaboratorsError) {
        console.error('Erro ao buscar colaboradores:', collaboratorsError);
        throw collaboratorsError;
      }

      if (!collaboratorsData || collaboratorsData.length === 0) {
        return [];
      }

      // Extrair os IDs dos usuários para buscar seus perfis
      const userIds = collaboratorsData.map(collab => collab.user_id);
      
      // Buscar os perfis dos usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Erro ao buscar perfis de usuários:', profilesError);
        throw profilesError;
      }

      // Combinar os dados para formar a lista de colaboradores
      const collaborators = collaboratorsData.map(collab => {
        const userProfile = profilesData?.find(profile => profile.id === collab.user_id);
        
        return {
          id: collab.user_id,
          email: userProfile?.username ? `${userProfile.username}@example.com` : 'sem-email@example.com',
          avatar_url: userProfile?.avatar_url || null,
          full_name: userProfile?.username || 'Sem nome'
        };
      });

      console.log('Colaboradores formatados:', collaborators);
      return collaborators;
    } catch (error: unknown) {
      console.error('Erro ao buscar colaboradores:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar colaboradores');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o usuário atual é dono de uma tarefa
  const isTaskOwner = async (taskId: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('user_id')
        .eq('id', taskId)
        .single();

      if (error || !data) return false;
      return data.user_id === currentUser.id;
    } catch (error: unknown) {
      console.error('Erro ao verificar propriedade da tarefa:', error);
      return false;
    }
  };

  return {
    loading,
    addCollaborator,
    removeCollaborator,
    getTaskCollaborators,
    isTaskOwner
  };
}
