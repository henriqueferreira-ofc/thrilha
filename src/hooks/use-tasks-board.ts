
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Board } from '@/types/board';
import { useTaskOperationsBoard } from './tasks/use-task-operations-board';
import { useRealtimeSubscription } from './subscription/use-realtime-subscription';

interface DatabaseTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string | null;
  due_date: string | null;
  user_id: string;
  board_id: string;
}

export function useTasksBoard(currentBoard: Board | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Função para formatar uma tarefa do banco de dados
  const formatTask = (task: DatabaseTask): Task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    created_at: task.created_at,
    updated_at: task.updated_at || task.created_at,
    due_date: task.due_date || undefined,
    user_id: task.user_id,
    board_id: task.board_id
  });

  // Carregar tarefas do quadro atual
  useEffect(() => {
    if (!user || !currentBoard) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        console.log(`Buscando tarefas do quadro ${currentBoard.id}...`);
        
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('board_id', currentBoard.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedTasks = (data || []).map(task => formatTask(task as DatabaseTask));
        setTasks(formattedTasks);
        console.log(`Carregadas ${formattedTasks.length} tarefas do quadro ${currentBoard.id}`);
      } catch (error: unknown) {
        console.error('Erro ao buscar tarefas:', error);
        toast.error('Erro ao carregar tarefas');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, currentBoard]);

  // Função para atualização otimista do estado
  const optimisticUpdate = {
    addTask: (newTask: Task) => {
      console.log('Atualizando estado otimisticamente - Adicionando tarefa:', newTask);
      setTasks(prev => [newTask, ...prev]);
    },
    updateTask: (updatedTask: Task) => {
      console.log('Atualizando estado otimisticamente - Atualizando tarefa:', updatedTask);
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
    },
    deleteTask: (taskId: string) => {
      console.log('Atualizando estado otimisticamente - Removendo tarefa:', taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  // Configurar handlers para eventos em tempo real
  const realtimeHandlers = {
    onInsert: (newTask: Task) => {
      console.log('Evento em tempo real - Adicionando tarefa:', newTask.title);
      // Verificar se a tarefa já existe no estado (para evitar duplicação)
      setTasks(prev => {
        if (!prev.some(task => task.id === newTask.id)) {
          return [newTask, ...prev];
        }
        return prev;
      });
    },
    onUpdate: (updatedTask: Task) => {
      console.log('Evento em tempo real - Atualizando tarefa:', updatedTask.title);
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
    },
    onDelete: (deletedTaskId: string) => {
      console.log('Evento em tempo real - Removendo tarefa:', deletedTaskId);
      setTasks(prev => prev.filter(task => task.id !== deletedTaskId));
    }
  };

  // Usar o hook de tempo real
  useRealtimeSubscription(
    currentBoard?.id,
    realtimeHandlers
  );

  return {
    tasks,
    loading,
    setTasks,
    optimisticUpdate
  };
}

export { useTaskOperationsBoard };
