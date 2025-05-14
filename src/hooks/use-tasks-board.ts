import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Board } from '@/types/board';
import { useTaskOperationsBoard } from './tasks/use-task-operations-board';

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
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('board_id', currentBoard.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedTasks = (data || []).map(task => formatTask(task as DatabaseTask));
        setTasks(formattedTasks);
      } catch (error: unknown) {
        console.error('Erro ao buscar tarefas:', error);
        toast.error('Erro ao carregar tarefas');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    
    // Configurar listener para atualizações em tempo real
    const tasksSubscription = supabase
      .channel(`tasks-board-${currentBoard.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'tasks',
        filter: `board_id=eq.${currentBoard.id}`
      }, (payload) => {
        console.log('Alteração em tarefas recebida:', payload);
        
        let newTask: Task;
        let updatedTask: Task;
        let deletedTaskId: string;
        
        switch (payload.eventType) {
          case 'INSERT':
            newTask = formatTask(payload.new as DatabaseTask);
            setTasks(prev => [newTask, ...prev]);
            break;
            
          case 'UPDATE':
            updatedTask = formatTask(payload.new as DatabaseTask);
            setTasks(prev => prev.map(task => 
              task.id === updatedTask.id ? updatedTask : task
            ));
            break;
            
          case 'DELETE':
            deletedTaskId = (payload.old as DatabaseTask).id;
            setTasks(prev => prev.filter(task => task.id !== deletedTaskId));
            break;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
    };
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

  return {
    tasks,
    loading,
    setTasks,
    optimisticUpdate
  };
}

export { useTaskOperationsBoard };
