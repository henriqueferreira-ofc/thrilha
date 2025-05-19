
import { useTaskCore } from './tasks/use-task-core';
import { useTaskOperations } from './tasks/use-task-operations';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import { Task } from '@/types/task';

export function useTasks() {
  const { tasks, setTasks, loading } = useTaskCore();
  const { addTask, updateTask, deleteTask, changeTaskStatus } = useTaskOperations(tasks, setTasks);
  const { user } = useAuth();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Configurar subscrição de tempo real para as tarefas
  useEffect(() => {
    if (!user) return;

    console.log('Configurando subscrição em tempo real para tarefas do usuário:', user.id);
    
    // Criar um canal para receber atualizações de tarefas
    const newChannel = supabase
      .channel(`user_tasks_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Todos os eventos
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Evento em tempo real recebido:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('Nova tarefa recebida em tempo real.');
            
            const newTask: Task = {
              id: payload.new.id,
              title: payload.new.title,
              description: payload.new.description || '',
              status: payload.new.status,
              created_at: payload.new.created_at,
              updated_at: payload.new.updated_at || payload.new.created_at,
              due_date: payload.new.due_date,
              user_id: payload.new.user_id,
              board_id: payload.new.board_id || ''
            };
            
            // Adicionar à lista se não existir
            setTasks(prev => {
              if (prev.some(task => task.id === newTask.id)) {
                return prev;
              }
              return [newTask, ...prev];
            });
          }
          else if (payload.eventType === 'UPDATE') {
            console.log('Atualização de tarefa recebida em tempo real.');
            
            const updatedTask: Task = {
              id: payload.new.id,
              title: payload.new.title,
              description: payload.new.description || '',
              status: payload.new.status,
              created_at: payload.new.created_at,
              updated_at: payload.new.updated_at || payload.new.created_at,
              due_date: payload.new.due_date,
              user_id: payload.new.user_id,
              board_id: payload.new.board_id || ''
            };
            
            // Atualizar na lista se existir
            setTasks(prev => 
              prev.map(task => task.id === updatedTask.id ? updatedTask : task)
            );
          }
          else if (payload.eventType === 'DELETE') {
            console.log('Exclusão de tarefa recebida em tempo real:', payload.old.id);
            
            // Remover da lista se existir
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    
    setChannel(newChannel);
    
    // Limpar a subscrição quando o componente for desmontado
    return () => {
      console.log('Removendo subscrição em tempo real');
      newChannel.unsubscribe();
    };
  }, [user, setTasks]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
  };
}
