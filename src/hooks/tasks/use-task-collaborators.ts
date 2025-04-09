
import { toast } from 'sonner';
import { TaskCollaborator } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useTaskCollaborators() {
  const { user } = useAuth();

  // Adicionar um colaborador a uma tarefa usando RPC
  const addCollaborator = async (taskId: string, userEmail: string): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para adicionar colaboradores');
      return false;
    }

    try {
      // Buscar o ID do usuário pelo email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', userEmail.split('@')[0])
        .single();

      if (userError || !userData) {
        toast.error('Usuário não encontrado');
        return false;
      }

      const collaboratorId = userData.id;

      // Verificar se o usuário já é colaborador usando a RPC
      const { data: existingCollaborator, error: checkError } = await supabase.rpc(
        'is_task_collaborator',
        {
          p_task_id: taskId,
          p_user_id: collaboratorId
        }
      );

      if (checkError) throw checkError;

      if (existingCollaborator) {
        toast.info('Este usuário já é colaborador desta tarefa');
        return false;
      }

      // Adicionar o colaborador usando a RPC
      const { error } = await supabase.rpc(
        'add_task_collaborator',
        {
          p_task_id: taskId,
          p_user_id: collaboratorId,
          p_added_by: user.id
        }
      );

      if (error) throw error;

      toast.success('Colaborador adicionado com sucesso!');
      return true;
    } catch (error: unknown) {
      console.error('Erro ao adicionar colaborador:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar colaborador');
      return false;
    }
  };

  // Remover um colaborador de uma tarefa usando RPC
  const removeCollaborator = async (collaboratorId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para remover colaboradores');
      return false;
    }

    try {
      // Remover o colaborador usando a RPC
      const { error } = await supabase.rpc(
        'remove_task_collaborator',
        {
          p_collaborator_id: collaboratorId
        }
      );

      if (error) throw error;

      toast.success('Colaborador removido com sucesso!');
      return true;
    } catch (error: unknown) {
      console.error('Erro ao remover colaborador:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao remover colaborador');
      return false;
    }
  };

  // Buscar colaboradores de uma tarefa usando RPC
  const getTaskCollaborators = async (taskId: string): Promise<TaskCollaborator[]> => {
    if (!user) {
      toast.error('Você precisa estar logado para ver colaboradores');
      return [];
    }

    try {
      // Buscar os colaboradores usando a RPC
      const { data, error } = await supabase.rpc(
        'get_task_collaborators',
        {
          p_task_id: taskId
        }
      );

      if (error) throw error;

      // Formatar os dados para o formato da aplicação
      const collaborators: TaskCollaborator[] = (data || []).map((collab: any) => ({
        id: collab.id,
        task_id: collab.task_id,
        user_id: collab.user_id,
        added_at: collab.added_at,
        added_by: collab.added_by,
        userEmail: collab.user_email || `${collab.username}@example.com`,
        userName: collab.username || 'Sem nome'
      }));

      return collaborators;
    } catch (error: unknown) {
      console.error('Erro ao buscar colaboradores:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar colaboradores');
      return [];
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
    addCollaborator,
    removeCollaborator,
    getTaskCollaborators,
    isTaskOwner
  };
}
