
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/task';

export function useTaskCore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load tasks from Supabase when the component mounts
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
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
          status: task.status as TaskStatus,
          created_at: task.created_at,
          updated_at: task.updated_at || task.created_at,
          due_date: task.due_date,
          user_id: task.user_id,
          board_id: task.board_id,
          completed: task.status === 'done'
        })) || [];

        setTasks(formattedTasks);
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        toast.error('Erro ao carregar tarefas');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  return {
    tasks,
    setTasks,
    loading
  };
}
