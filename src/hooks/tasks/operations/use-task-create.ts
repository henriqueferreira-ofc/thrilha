import { toast } from 'sonner';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { supabase } from '@/supabase/client';
import { Board } from '@/types/board';
import { useTaskCounter } from '../use-task-counter';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/use-subscription';

export function useTaskCreate(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: any | null,
  currentBoard: Board | null
) {
  const { totalTasks, totalLimit, incrementCompletedTasks } = useTaskCounter();
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
      toast.error(`Você atingiu o limite de ${totalLimit} tarefas do plano gratuito. Faça upgrade para o plano Pro.`);
      navigate('/subscription');
      return null;
    }

    try {
      console.log("Criando nova tarefa:", {
        board: currentBoard.id,
        title: taskData.title,
        totalTasks
      });
      
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

      console.log("Tarefa criada com sucesso:", createdTask);
      
      // Adicionar nova tarefa ao estado
      setTasks(prev => [createdTask, ...prev]);

      // Incrementar o contador DEPOIS de criar a tarefa com sucesso
      if (!isPro) {
        await incrementCompletedTasks();
        
        // Se atingiu o limite após criar, redirecionar para upgrade
        if (totalTasks + 1 >= totalLimit) {
          toast.error(`Você atingiu o limite de ${totalLimit} tarefas do plano gratuito. Faça upgrade para continuar.`);
          navigate('/subscription');
          return createdTask;
        }
      }
      
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
