
import { toast } from 'sonner';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { supabase } from '@/supabase/client';
import { Board } from '@/types/board';

export function useTaskCreate(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: any | null,
  currentBoard: Board | null
) {
  // Adicionar uma nova tarefa
  const addTask = async (taskData: TaskFormData): Promise<Task | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para criar tarefas');
      return null;
    }

    if (!currentBoard) {
      toast.error('Você precisa selecionar um quadro para criar tarefas');
      return null;
    }

    try {
      const newTask = {
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo' as TaskStatus,
        due_date: taskData.dueDate,
        board_id: currentBoard.id,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) throw error;

      const createdTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        due_date: data.due_date,
        user_id: data.user_id,
        board_id: data.board_id,
        completed: false
      };

      // Adicionar nova tarefa ao estado
      setTasks(prev => [createdTask, ...prev]);
      
      toast.success('Tarefa criada com sucesso!');
      return createdTask;
    } catch (error: unknown) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
      return null;
    }
  };

  return { addTask };
}
