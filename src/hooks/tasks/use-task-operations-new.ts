
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase/client';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  dueDate?: string;
  user_id: string;
}

interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: string;
}

type TaskStatus = 'todo' | 'inProgress' | 'done';

export function useTaskOperationsNew(tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const { user } = useAuth();

  // Add a new task
  const addTask = async (taskData: TaskFormData): Promise<Task | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para criar tarefas');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || '',
          status: 'todo',
          user_id: user.id,
          due_date: taskData.dueDate,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const formattedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as TaskStatus,
        createdAt: data.created_at,
        dueDate: data.due_date,
        user_id: data.user_id
      };

      setTasks((prev) => [formattedTask, ...prev]);
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
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          status: updatedData.status,
          due_date: updatedData.dueDate
        })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updatedData } : task
      ));
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
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
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
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      toast.success('Status da tarefa atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao atualizar status da tarefa');
    }
  };

  // Get status name
  const getStatusName = (status: TaskStatus): string => {
    switch (status) {
      case 'todo':
        return 'A fazer';
      case 'inProgress':
        return 'Em andamento';
      case 'done':
        return 'Concluído';
      default:
        return 'Desconhecido';
    }
  };

  return {
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    getStatusName
  };
}
