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
      console.log('Criando nova tarefa:', taskData);

      // Verificar se o board_id está presente
      if (!taskData.board_id) {
        toast.error('É necessário selecionar um quadro para criar a tarefa');
        return null;
      }

      // Preparar dados para inserção
      const taskToInsert = {
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo',
        user_id: user.id,
        due_date: taskData.dueDate,
        board_id: taskData.board_id,
        created_at: new Date().toISOString()
      };

      console.log('Dados para inserção:', taskToInsert);

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskToInsert)
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Nenhum dado retornado após a inserção');
      }

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as TaskStatus,
        created_at: data.created_at,
        updated_at: data.created_at,
        due_date: data.due_date,
        user_id: data.user_id,
        board_id: data.board_id
      };

      // Atualizar o estado local
      setTasks(prevTasks => {
        const updatedTasks = [newTask, ...prevTasks];
        console.log('Tarefas após adição:', updatedTasks);
        return updatedTasks;
      });

      toast.success('Tarefa criada com sucesso!');
      return newTask;
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
      return null;
    }
  };

  // Update a task
  const updateTask = async (id: string, updatedData: Partial<Task>) => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar tarefas');
      return;
    }

    try {
      console.log('Atualizando tarefa:', { id, updatedData });

      // Atualizar no banco de dados
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          due_date: updatedData.due_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar o estado local
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          if (task.id === id) {
            return {
              ...task,
              ...updatedData,
              updated_at: new Date().toISOString()
            };
          }
          return task;
        });

        console.log('Tarefas após atualização:', updatedTasks);
        return updatedTasks;
      });

      toast.success('Tarefa atualizada com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
      return null;
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

      // Atualizar o estado local
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.filter(task => task.id !== id);
        console.log('Tarefas após exclusão:', updatedTasks);
        return updatedTasks;
      });

      toast.success('Tarefa excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  // Change task status
  const changeTaskStatus = async (id: string, newStatus: TaskStatus) => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar o status das tarefas');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          if (task.id === id) {
            return {
              ...task,
              status: newStatus,
              updated_at: new Date().toISOString()
            };
          }
          return task;
        });

        console.log('Tarefas após mudança de status:', updatedTasks);
        return updatedTasks;
      });

      toast.success('Status da tarefa atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
      toast.error('Erro ao alterar status da tarefa');
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
