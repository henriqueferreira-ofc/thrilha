
import { toast } from '@/hooks/toast';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { supabase } from '@/supabase/client';
import { User } from '@supabase/supabase-js';

export function useTaskCreate(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: User | null,
  optimisticUpdate?: {
    addTask: (task: Task) => void;
  }
) {
  // Adicionar uma nova tarefa
  const addTask = async (taskData: TaskFormData): Promise<Task | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para criar tarefas');
      return null;
    }

    let tempId = '';

    try {
      console.log(`Iniciando criação de tarefa...`);
      
      // Gerar um ID temporário para atualização otimista
      tempId = `temp-${Date.now()}`;
      
      // Criar objeto da nova tarefa com ID temporário
      const tempTask: Task = {
        id: tempId,
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo' as TaskStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: taskData.dueDate,
        user_id: user.id,
        board_id: taskData.board_id || 'default'
      };

      console.log('Preparando para enviar tarefa para o backend:', tempTask.title);

      // Preparar dados para enviar ao servidor (sem o ID temporário)
      const newTask: Omit<Task, 'id'> = {
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo' as TaskStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: taskData.dueDate,
        user_id: user.id,
        board_id: taskData.board_id || 'default'
      };

      // Enviar para o backend
      console.log('Enviando tarefa para o backend:', newTask.title);
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) {
        console.error('Erro na criação, revertendo alterações locais:', error);
        throw error;
      }

      // Converter resposta para o formato Task
      const createdTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        due_date: data.due_date,
        user_id: data.user_id,
        board_id: data.board_id || 'default'
      };

      console.log('Tarefa criada com sucesso no servidor:', createdTask.id);

      // SOMENTE APÓS a tarefa ser criada no servidor, aplicamos no estado local
      // Evitando assim a duplicação
      if (optimisticUpdate) {
        optimisticUpdate.addTask(createdTask);
      } else {
        setTasks(prev => [createdTask, ...prev]);
      }
      
      return createdTask;
    } catch (error: unknown) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
      return null;
    }
  };

  return { addTask };
}
