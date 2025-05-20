
import { toast } from 'sonner';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useTaskAdd(tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
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

  return { addTask };
}
