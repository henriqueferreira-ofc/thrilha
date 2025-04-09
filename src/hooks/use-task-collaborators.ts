
import { useState } from 'react';
import { toast } from 'sonner';
import { TaskCollaborator } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useTaskCollaborators() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Adicionar um colaborador a uma tarefa
  const addCollaborator = async (taskId: string, userEmail: string): Promise<boolean> => {
    if (!user) {
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

      if (userError || !userData) {
        console.error('Erro ao buscar usuário:', userError);
        toast.error('Usuário não encontrado');
        return false;
      }

      const collaboratorId = userData.id;
      console.log('ID do colaborador encontrado:', collaboratorId);

      // Verificar se o usuário já é colaborador
      const { data: existingCollaborator, error: checkError } = await supabase
        .from('task_collaborators')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', collaboratorId)
        .single();

      if (!checkError && existingCollaborator) {
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
    if (!user) {
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
  const getTaskCollaborators = async (taskId: string): Promise<TaskCollaborator[]> => {
    if (!user) {
      toast.error('Você precisa estar logado para ver colaboradores');
      return [];
    }
    
    setLoading(true);

    try {
      // Buscar os colaboradores diretamente com join na tabela de perfis
      const { data, error } = await supabase
        .from('task_collaborators')
        .select(`
          id,
          task_id,
          user_id,
          created_at,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('task_id', taskId);

      if (error) {
        console.error('Erro ao buscar colaboradores:', error);
        throw error;
      }

      // Formatar os dados para o formato da aplicação
      const collaborators: TaskCollaborator[] = (data || []).map((collab: any) => ({
        id: collab.id,
        task_id: collab.task_id,
        user_id: collab.user_id,
        added_at: collab.created_at,
        added_by: user.id,
        userEmail: collab.profiles?.username ? `${collab.profiles.username}@example.com` : 'sem-email@example.com',
        userName: collab.profiles?.username || 'Sem nome',
        permissions: {
          canEdit: true,
          canDelete: true,
          canManageCollaborators: false
        }
      }));

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
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('user_id')
        .eq('id', taskId)
        .single();

      if (error || !data) return false;
      return data.user_id === user.id;
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
