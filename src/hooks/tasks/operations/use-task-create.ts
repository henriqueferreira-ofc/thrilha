
import { toast } from 'sonner';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { supabase } from '@/supabase/client';
import { Board } from '@/types/board';
import { useTaskCounter } from '../use-task-counter';
import { useSubscription } from '@/hooks/use-subscription';

export function useTaskCreate(
  tasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>, 
  user: any | null,
  currentBoard: Board | null
) {
  // Integrar verificador de limites e status da assinatura
  const { limitReached } = useTaskCounter();
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

    // Verificar limite de tarefas concluídas para usuários do plano gratuito
    if (limitReached && !isPro) {
      toast.error('Você atingiu o limite de tarefas do plano gratuito. Faça upgrade para o plano Pro.');
      return null;
    }

    try {
      // Criar um ID temporário para a tarefa
      const tempId = crypto.randomUUID();
      
      // Criar a nova tarefa com dados temporários
      const newTask: Task = {
        id: tempId,
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: taskData.dueDate,
        user_id: user.id,
        board_id: currentBoard.id,
        completed: false
      };

      // Atualizar o estado local imediatamente
      setTasks(prev => [newTask, ...prev]);

      // Enviar para o banco de dados
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || '',
          status: 'todo' as TaskStatus,
          user_id: user.id,
          board_id: currentBoard.id,
          due_date: taskData.dueDate
        })
        .select()
        .single();

      if (error) {
        // Se houver erro, remover a tarefa temporária do estado local
        setTasks(prev => prev.filter(task => task.id !== tempId));
        throw error;
      }

      // Atualizar o estado local com os dados reais do banco
      const formattedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as TaskStatus,
        created_at: data.created_at,
        updated_at: data.updated_at,
        due_date: data.due_date,
        user_id: data.user_id,
        board_id: data.board_id,
        completed: data.status === 'done'
      };

      setTasks(prev => prev.map(task => 
        task.id === tempId ? formattedTask : task
      ));

      toast.success('Tarefa criada com sucesso!');
      return formattedTask;
    } catch (error: unknown) {
      console.error('Erro ao criar tarefa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar tarefa');
      return null;
    }
  };

  return { addTask };
}
