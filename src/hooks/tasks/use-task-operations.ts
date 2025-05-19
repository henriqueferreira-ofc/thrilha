import { toast } from 'sonner';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { normalizeTaskStatus } from '@/lib/task-utils';

export function useTaskOperations(tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const { user } = useAuth();

  // Add a new task
  const addTask = async (taskData: TaskFormData): Promise<Task | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para criar tarefas');
      return null;
    }

    try {
      // Preparar dados para enviar ao servidor
      const newTask = {
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo',
        user_id: user.id,
        due_date: taskData.dueDate,
        created_at: new Date().toISOString(),
        board_id: taskData.board_id || 'default'
      };

      // Enviar para o backend
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) throw error;

      const formattedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: normalizeTaskStatus(data.status),
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
        due_date: data.due_date,
        user_id: data.user_id,
        board_id: data.board_id
      };

      // Atualizar o estado local de forma mais rigorosa
      setTasks(prev => {
        // Criar um Set com os IDs existentes para verificação rápida
        const existingIds = new Set(prev.map(task => task.id));
        
        // Se a tarefa já existe, retornar o estado atual sem modificações
        if (existingIds.has(formattedTask.id)) {
          console.log('Tarefa já existe no estado, ignorando:', formattedTask.id);
          return prev;
        }
        
        // Criar um novo array com a nova tarefa no início
        const updatedTasks = [formattedTask, ...prev];
        console.log('Nova tarefa adicionada ao estado:', formattedTask.id);
        return updatedTasks;
      });

      toast.success('Tarefa criada com sucesso!');
      return formattedTask;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
      return null;
    }
  };

  // Update a task
  const updateTask = async (id: string, updatedData: Partial<Task>): Promise<void> => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    try {
      // Se status está sendo atualizado, garantir que está no formato correto para o banco
      const dataForDb = { ...updatedData };
      
      const { error } = await supabase
        .from('tasks')
        .update(dataForDb)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? {
                ...task,
                ...updatedData,
                status: updatedData.status ? normalizeTaskStatus(updatedData.status) : task.status
              }
            : task
        )
      );

      toast.success('Tarefa atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir tarefas');
      return;
    }

    try {
      // Remover a tarefa do estado local imediatamente para feedback instantâneo
      setTasks((prev) => {
        const updatedTasks = prev.filter((task) => task.id !== id);
        console.log('Tarefa removida do estado local:', id);
        return updatedTasks;
      });
      
      // Enviar a exclusão para o backend
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao excluir tarefa no servidor:', error);
        // Se houver erro, buscar a lista atualizada de tarefas
        const { data: tasks, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Erro ao buscar tarefas após falha na exclusão:', fetchError);
          throw fetchError;
        }

        // Atualizar o estado com a lista correta do servidor
        setTasks(tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: normalizeTaskStatus(task.status),
          created_at: task.created_at,
          updated_at: task.updated_at || task.created_at,
          due_date: task.due_date,
          user_id: task.user_id,
          board_id: task.board_id
        })));

        throw error;
      }

      toast.success('Tarefa excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  // Change task status
  const changeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar o status da tarefa');
      return;
    }

    try {
      const normalizedStatus = normalizeTaskStatus(newStatus);
      
      // Atualizar o estado local imediatamente para melhor experiência do usuário
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: normalizedStatus } : task
        )
      );
      
      // Enviar atualização para o backend
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: normalizedStatus
        })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        // Se houver erro, reverter a alteração no estado local
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: task.status } : task
          )
        );
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  // Helper function to get readable status name
  const getStatusName = (status: TaskStatus): string => {
    switch (status) {
      case 'todo':
        return 'A Fazer';
      case 'in-progress':
        return 'Em Progresso';
      case 'done':
        return 'Concluída';
      default:
        return status;
    }
  };

  return {
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus
  };
}
