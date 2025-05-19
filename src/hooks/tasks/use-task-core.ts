
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/task';
import { normalizeTaskStatus } from '@/lib/task-utils';

export function useTaskCore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load tasks from Supabase when the component mounts
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        console.log('useTaskCore: Carregando tarefas para usuário', user.id);
        
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedTasks: Task[] = data?.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: normalizeTaskStatus(task.status),
          created_at: task.created_at,
          updated_at: task.updated_at || task.created_at,
          due_date: task.due_date,
          user_id: task.user_id,
          board_id: task.board_id || ''
        })) || [];

        console.log(`useTaskCore: ${formattedTasks.length} tarefas carregadas`);
        setTasks(formattedTasks);
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        toast.error('Erro ao carregar tarefas');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // Configure real-time subscription
    const channel = supabase
      .channel('public:tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Evento em tempo real recebido em useTaskCore:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as Task;
          setTasks(prev => [newTask, ...prev]);
        } 
        else if (payload.eventType === 'UPDATE') {
          const updatedTask = payload.new as Task;
          setTasks(prev => 
            prev.map(task => task.id === updatedTask.id ? updatedTask : task)
          );
        }
        else if (payload.eventType === 'DELETE') {
          const deletedTaskId = payload.old.id;
          setTasks(prev => prev.filter(task => task.id !== deletedTaskId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    tasks,
    setTasks,
    loading
  };
}
