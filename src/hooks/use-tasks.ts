import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client'; // Ensure this points to the correct file
import { useAuth } from './use-auth';
import { useTaskCollaborators } from './tasks/use-task-collaborators';
import toast from 'react-hot-toast';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load tasks from Supabase when the component mounts
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

        const formattedTasks: Task[] = data?.map((task: TaskRow) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as TaskStatus,
          createdAt: task.created_at,
          dueDate: task.due_date,
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

    // Set up real-time subscription
    const tasksSubscription = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Alteração em tempo real recebida:', payload);

          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as TaskRow;
            if (newTask.user_id === user.id) {
              const formattedTask: Task = {
                id: newTask.id,
                title: newTask.title,
                description: newTask.description || '',
                status: newTask.status as TaskStatus,
                createdAt: newTask.created_at,
                dueDate: newTask.due_date,
              };
              setTasks((prev) => [formattedTask, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as TaskRow;
            if (updatedTask.user_id === user.id) {
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === updatedTask.id
                    ? {
                        id: updatedTask.id,
                        title: updatedTask.title,
                        description: updatedTask.description || '',
                        status: updatedTask.status as TaskStatus,
                        createdAt: updatedTask.created_at,
                        dueDate: updatedTask.due_date,
                      }
                    : task
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedTaskId = payload.old.id;
            if (payload.old.user_id === user.id) {
              setTasks((prev) => prev.filter((task) => task.id !== deletedTaskId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
    };
  }, [user]);

  // Add a new task
  const addTask = async (taskData: TaskFormData): Promise<Task | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para criar tarefas');
      return null;
    }

    try {
      const tempId = crypto.randomUUID();
      const newTask: Task = {
        id: tempId,
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo',
        createdAt: new Date().toISOString(),
        dueDate: taskData.dueDate,
      };

      setTasks((prev) => [newTask, ...prev]);

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || '',
          status: 'todo' as TaskStatus,
          user_id: user.id,
          due_date: taskData.dueDate,
        })
        .select()
        .single();

      if (error) {
        setTasks((prev) => prev.filter((task) => task.id !== tempId));
        throw error;
      }

      const formattedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as TaskStatus,
        createdAt: data.created_at,
        dueDate: data.due_date,
      };

      setTasks((prev) => prev.map((task) => (task.id === tempId ? formattedTask : task)));

      toast.success('Tarefa criada com sucesso!');
      return formattedTask;
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar tarefa');
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
      const dbData: Partial<TaskRow> = {
        title: updatedData.title,
        description: updatedData.description,
        status: updatedData.status,
        due_date: updatedData.dueDate,
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
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar tarefa');
    }
  };

  // Delete a task
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

      setTasks((prev) => prev.filter((task) => task.id !== id));
      toast.success('Tarefa excluída com sucesso!');
    } catch (error: any) {
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
      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask) throw new Error('Tarefa não encontrada');

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: currentTask.status } : task
          )
        );
        throw error;
      }

      toast.success(`Status da tarefa alterado para ${getStatusName(newStatus)}!`);
    } catch (error: any) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  // Helper function to get readable status name
  const getStatusName = (status: TaskStatus): string => {
    switch (status) {
      case 'todo':
        return 'A Fazer';
      case 'inProgress':
        return 'Em Progresso';
      case 'done':
        return 'Concluída';
      default:
        return status;
    }
  };

  // Use collaborator-related functionality
  const { addCollaborator, removeCollaborator, getTaskCollaborators, isTaskOwner } =
    useTaskCollaborators();

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    addCollaborator,
    removeCollaborator,
    getTaskCollaborators,
    isTaskOwner,
  };
}

// Type definitions
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  dueDate?: string;
}

interface TaskRow {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  due_date?: string;
  user_id: string;
}

interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: string;
}

type TaskStatus = 'todo' | 'inProgress' | 'done';
type ErrorType = Error | unknown;