
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Task, TaskStatus, TaskFormData } from '../types/task';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Database } from '@/integrations/supabase/types';

// Definindo tipos para as tabelas do Supabase
type Tables = Database['public']['Tables'];
type TaskRow = Tables['tasks']['Row'];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Carregar tarefas do Supabase quando o componente for montado
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Tarefas carregadas do Supabase:', data);
        
        // Convertendo do formato do banco para o formato usado na aplicação
        const formattedTasks: Task[] = data?.map((task: TaskRow) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as TaskStatus,
          createdAt: task.created_at,
          dueDate: task.due_date
        })) || [];
        
        setTasks(formattedTasks);
      } catch (error: any) {
        console.error('Erro ao buscar tarefas:', error.message);
        toast.error('Erro ao carregar tarefas');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    
    // Configurar listener para atualizações em tempo real
    const tasksSubscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Alteração em tempo real recebida:', payload);
        
        // Atualizar o estado das tarefas com base no evento
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as TaskRow;
          const formattedTask: Task = {
            id: newTask.id,
            title: newTask.title,
            description: newTask.description || '',
            status: newTask.status as TaskStatus,
            createdAt: newTask.created_at,
            dueDate: newTask.due_date
          };
          setTasks(prev => [formattedTask, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedTask = payload.new as TaskRow;
          setTasks(prev => 
            prev.map(task => task.id === updatedTask.id ? {
              id: updatedTask.id,
              title: updatedTask.title,
              description: updatedTask.description || '',
              status: updatedTask.status as TaskStatus,
              createdAt: updatedTask.created_at,
              dueDate: updatedTask.due_date
            } : task)
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedTaskId = payload.old.id;
          setTasks(prev => prev.filter(task => task.id !== deletedTaskId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
    };
  }, [user]);

  // Adicionar uma nova tarefa
  const addTask = async (taskData: TaskFormData) => {
    if (!user) {
      toast.error('Você precisa estar logado para criar tarefas');
      return null;
    }

    try {
      const newTask = {
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo' as TaskStatus,
        user_id: user.id,
        due_date: taskData.dueDate
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) throw error;

      toast.success('Tarefa criada com sucesso!');
      
      // Convertendo para o formato usado na aplicação
      const formattedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as TaskStatus,
        createdAt: data.created_at,
        dueDate: data.due_date
      };
      
      return formattedTask;
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
      return null;
    }
  };

  // Atualizar uma tarefa
  const updateTask = async (id: string, updatedData: Partial<Task>) => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    try {
      // Converter de volta para o formato do banco de dados
      const dbData: Partial<TaskRow> = {
        title: updatedData.title,
        description: updatedData.description,
        status: updatedData.status,
        due_date: updatedData.dueDate
      };

      const { error } = await supabase
        .from('tasks')
        .update(dbData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Tarefa atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  // Excluir uma tarefa
  const deleteTask = async (id: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir tarefas');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Tarefa removida com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  // Alterar o status de uma tarefa
  const changeTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`Status da tarefa alterado para ${getStatusName(newStatus)}!`);
    } catch (error: any) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  // Função auxiliar para obter o nome legível do status
  const getStatusName = (status: TaskStatus): string => {
    switch (status) {
      case 'todo': return 'A Fazer';
      case 'inProgress': return 'Em Progresso';
      case 'done': return 'Concluída';
      default: return status;
    }
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus
  };
}
