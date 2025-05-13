
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Board } from '@/types/board';

export function useTasksBoard(currentBoard: Board | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
        
        // Convertendo do formato do banco para o formato usado na aplicação
        const formattedTasks: Task[] = data?.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as TaskStatus,
          created_at: task.created_at,
          updated_at: task.updated_at || task.created_at,
          due_date: task.due_date,
          user_id: task.user_id,
          board_id: task.board_id,
          completed: task.status === 'done'
        })) || [];
        
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
        
        // Atualizar o estado das tarefas com base no evento
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as any;
          const formattedTask: Task = {
            id: newTask.id,
            title: newTask.title,
            description: newTask.description || '',
            status: newTask.status as TaskStatus,
            created_at: newTask.created_at,
            updated_at: newTask.updated_at || newTask.created_at,
            due_date: newTask.due_date,
            user_id: newTask.user_id,
            board_id: newTask.board_id,
            completed: newTask.status === 'done'
          };
          setTasks(prev => [formattedTask, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedTask = payload.new as any;
          setTasks(prev => 
            prev.map(task => task.id === updatedTask.id ? {
              id: updatedTask.id,
              title: updatedTask.title,
              description: updatedTask.description || '',
              status: updatedTask.status as TaskStatus,
              created_at: updatedTask.created_at,
              updated_at: updatedTask.updated_at || updatedTask.created_at,
              due_date: updatedTask.due_date,
              user_id: updatedTask.user_id,
              board_id: updatedTask.board_id,
              completed: updatedTask.status === 'done'
            } : task)
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedTaskId = payload.old.id;
          setTasks(prev => prev.filter(task => task.id !== deletedTaskId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
    };
  }, [user, currentBoard]);

  return {
    tasks,
    loading,
    setTasks
  };
}
