
import { toast } from '@/hooks/toast';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { supabase } from '@/supabase/client';
import { Board } from '@/types/board';
import { useTaskCounter } from '../use-task-counter';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/subscription/use-subscription';
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
      console.log(`Iniciando criação de tarefa no quadro ${currentBoard.id}...`);
      
      // Gerar um ID temporário para atualização otimista
      const tempId = `temp-${Date.now()}`;
      
      // Criar objeto da nova tarefa com ID temporário
      const tempTask: Task = {
        id: tempId,
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo' as TaskStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: taskData.dueDate,
        board_id: currentBoard.id,
        user_id: user.id
      };

      // Aplicar atualização otimista SEMPRE antes da operação de banco de dados
      console.log('Aplicando atualização otimista com tempTask:', tempTask.title);
      if (optimisticUpdate) {
        optimisticUpdate.addTask(tempTask);
      } else {
        setTasks(prev => [tempTask, ...prev]);
      }

      // Preparar dados para enviar ao servidor (sem o ID temporário)
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

      // Enviar para o backend
      console.log('Enviando tarefa para o backend:', newTask.title);
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) {
        // Reverter a atualização otimista em caso de erro
        console.error('Erro na criação, revertendo alterações locais:', error);
        setTasks(prev => prev.filter(task => task.id !== tempId));
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
        board_id: data.board_id
      };

      console.log('Tarefa criada com sucesso no servidor:', createdTask.id);

      // Atualizar o estado com o ID real (substituir a tarefa temporária)
      // Importante: usamos filter + unshift ao invés de map para evitar duplicações
      setTasks(prev => {
        const filteredTasks = prev.filter(task => task.id !== tempId);
        return [createdTask, ...filteredTasks];
      });

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
