import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { TaskRow } from '@/types/supabase';

export function useTaskCore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Carregar tarefas do Supabase quando o componente for montado
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Tarefas carregadas do Supabase:', data);
        
        // Convertendo do formato do banco para o formato usado na aplicação
        const formattedTasks: Task[] = data?.map((task: TaskRow) => ({
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
      .channel('public:tasks')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'tasks'
      }, (payload) => {
        console.log('Alteração em tempo real recebida:', payload);
        
        // Atualizar o estado das tarefas com base no evento
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as TaskRow;
          if (newTask.user_id === user.id) {  // Verificar se a tarefa pertence ao usuário atual
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
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedTask = payload.new as TaskRow;
          if (updatedTask.user_id === user.id) {  // Verificar se a tarefa pertence ao usuário atual
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
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedTaskId = payload.old.id;
          if (payload.old.user_id === user.id) {  // Verificar se a tarefa pertence ao usuário atual
            setTasks(prev => prev.filter(task => task.id !== deletedTaskId));
          }
        }
      })
      .subscribe();

    // Configurar listener para atualizações em tempo real da tabela task_collaborators
    const collaboratorSubscription = supabase
      .channel('public:task_collaborators')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'task_collaborators'
      }, async (payload) => {
        console.log('Alteração em colaboradores recebida:', payload);
        
        // Se foi adicionado como colaborador em uma nova tarefa, buscar a tarefa
        if (payload.eventType === 'INSERT') {
          const newCollaborator = payload.new as any;
          if (newCollaborator.user_id === user.id) {
            // Buscar a tarefa onde foi adicionado como colaborador
            const { data, error } = await supabase
              .from('tasks')
              .select('*')
              .eq('id', newCollaborator.task_id)
              .single();
            
            if (!error && data) {
              const collaboratedTask: Task = {
                id: data.id,
                title: data.title,
                description: data.description || '',
                status: data.status as TaskStatus,
                created_at: data.created_at,
                updated_at: data.updated_at || data.created_at,
                due_date: data.due_date,
                user_id: data.user_id,
                board_id: data.board_id,
                completed: data.status === 'done'
              };
              
              // Adicionar à lista de tarefas apenas se ainda não existir
              setTasks(prev => {
                if (!prev.some(task => task.id === collaboratedTask.id)) {
                  return [collaboratedTask, ...prev];
                }
                return prev;
              });
            }
          }
        } 
        // Se foi removido como colaborador, verificar se precisa remover a tarefa da lista
        else if (payload.eventType === 'DELETE') {
          const oldCollaborator = payload.old as any;
          if (oldCollaborator.user_id === user.id) {
            // Verificar se ainda tem acesso à tarefa como dono
            const { data, error } = await supabase
              .from('tasks')
              .select('*')
              .eq('id', oldCollaborator.task_id)
              .eq('user_id', user.id)
              .single();
            
            // Se não for o dono da tarefa, remover da lista
            if (error) {
              setTasks(prev => prev.filter(task => task.id !== oldCollaborator.task_id));
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(collaboratorSubscription);
    };
  }, [user]);

  return {
    tasks,
    loading,
    setTasks
  };
}
