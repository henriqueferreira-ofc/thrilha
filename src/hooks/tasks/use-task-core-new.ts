
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  dueDate?: string;
  user_id: string;
}

interface TaskRow {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  due_date?: string;
  user_id: string;
}

type TaskStatus = 'todo' | 'inProgress' | 'done';

export function useTaskCoreNew() {
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
          .select(`
            *,
            task_collaborators!inner (
              user_id
            )
          `)
          .or(`user_id.eq.${user.id},task_collaborators.user_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedTasks: Task[] = data?.map((task: TaskRow) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as TaskStatus,
          createdAt: task.created_at,
          dueDate: task.due_date,
          user_id: task.user_id
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
