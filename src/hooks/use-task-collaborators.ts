import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Collaborator {
  id: string;
  email: string;
  avatar_url: string | null;
  full_name: string | null;
}

interface SupabaseCollaborator {
  id: string;
  user_id: string;
  users: {
    id: string;
    email: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

export function useTaskCollaborators() {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollaborators = async (taskId: string) => {
    if (!user) return;
    
    console.log('Carregando colaboradores para a tarefa:', taskId);
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('task_collaborators')
        .select(`
          id,
          user_id,
          users:user_id (
            id,
            email,
            avatar_url,
            full_name
          )
        `)
        .eq('task_id', taskId);

      if (error) {
        console.error('Erro ao buscar colaboradores:', error);
        throw error;
      }

      console.log('Dados brutos dos colaboradores:', data);

      const formattedCollaborators = data.map((item: { user_id: string; users: { email: string; avatar_url: string | null; full_name: string | null } }) => ({
        id: item.user_id,
        email: item.users.email,
        avatar_url: item.users.avatar_url,
        full_name: item.users.full_name
      }));

      console.log('Colaboradores formatados:', formattedCollaborators);
      setCollaborators(formattedCollaborators);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err);
      setError('Erro ao carregar colaboradores');
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setIsLoading(false);
    }
  };

  const isTaskOwner = async (taskId: string): Promise<boolean> => {
    if (!user) return false;

    console.log('Verificando se usuário é dono da tarefa:', taskId);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('user_id')
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Erro ao verificar dono da tarefa:', error);
        throw error;
      }

      const isOwner = data?.user_id === user.id;
      console.log('É dono da tarefa?', isOwner);
      return isOwner;
    } catch (err) {
      console.error('Erro ao verificar dono da tarefa:', err);
      return false;
    }
  };

  const addCollaborator = async (taskId: string, email: string) => {
    if (!user) return;

    try {
      // Primeiro, encontrar o ID do usuário pelo email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        throw new Error('Usuário não encontrado');
      }

      // Depois, adicionar como colaborador
      const { error: collaboratorError } = await supabase
        .from('task_collaborators')
        .insert({
          task_id: taskId,
          user_id: userData.id
        });

      if (collaboratorError) throw collaboratorError;

      // Recarregar lista de colaboradores
      await loadCollaborators(taskId);
      toast.success('Colaborador adicionado com sucesso!');
    } catch (err) {
      console.error('Erro ao adicionar colaborador:', err);
      toast.error('Erro ao adicionar colaborador');
      throw err;
    }
  };

  const removeCollaborator = async (taskId: string, userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('task_collaborators')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      // Recarregar lista de colaboradores
      await loadCollaborators(taskId);
      toast.success('Colaborador removido com sucesso!');
    } catch (err) {
      console.error('Erro ao remover colaborador:', err);
      toast.error('Erro ao remover colaborador');
      throw err;
    }
  };

  return {
    collaborators,
    isLoading,
    error,
    loadCollaborators,
    isTaskOwner,
    addCollaborator,
    removeCollaborator
  };
} 