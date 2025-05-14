
import { toast } from '@/hooks/toast';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { supabase } from '@/supabase/client';
import { Board } from '@/types/board';
import { useTaskCounter } from '../use-task-counter';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/subscription';
import { User } from '@supabase/supabase-js';

export function useTaskCreate(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: User | null,
  currentBoard: Board | null,
  optimisticUpdate?: {
    addTask: (task: Task) => void;
  }
) {
  const { totalTasks, totalLimit, syncCompletedTasksCount } = useTaskCounter(currentBoard);
  const navigate = useNavigate();
  const { isPro } = useSubscription();

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

    // Verificar se já atingiu o limite do plano gratuito
    if (!isPro && totalTasks >= totalLimit) {
      navigate('/subscription');
      return null;
    }

    try {
      // Criar objeto da nova tarefa
      const newTask: Omit<Task, 'id'> = {
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo' as TaskStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: taskData.dueDate,
        board_id: currentBoard.id,
        user_id: user.id
      };

      // Atualização otimista do estado
      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = { ...newTask, id: tempId };
      
      console.log('Criando tarefa com atualização otimista:', tempTask.title);
      
      if (optimisticUpdate) {
        optimisticUpdate.addTask(tempTask);
      } else {
        setTasks(prev => [tempTask, ...prev]);
      }

      // Enviar para o backend
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) {
        // Reverter a atualização otimista em caso de erro
        console.error('Erro na criação, revertendo alterações locais');
        setTasks(prev => prev.filter(task => task.id !== tempId));
        throw error;
      }

      const createdTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        due_date: data.due_date,
        user_id: data.user_id,
        board_id: data.board_id
      };

      // Atualizar o estado com o ID real
      setTasks(prev => prev.map(task => 
        task.id === tempId ? createdTask : task
      ));

      console.log('Tarefa criada com sucesso:', createdTask.title);

      // Atualizar o contador imediatamente após criar a tarefa
      await syncCompletedTasksCount();
      
      // Se atingiu o limite após criar, redirecionar para upgrade
      if (!isPro && totalTasks + 1 >= totalLimit) {
        navigate('/subscription');
      }
      
      return createdTask;
    } catch (error: unknown) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
      
      // Remover a tarefa temporária em caso de erro
      setTasks(prev => prev.filter(task => task.id !== `temp-${Date.now()}`));
      return null;
    }
  };

  return { addTask };
}
