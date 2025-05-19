
import { useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { Task } from '@/types/task';

interface RealtimeHandlers {
  onInsert?: (newTask: Task) => void;
  onUpdate?: (updatedTask: Task) => void;
  onDelete?: (deletedTaskId: string) => void;
}

export function useRealtimeSubscription(
  boardId: string | undefined,
  userId: string | undefined,
  handlers: RealtimeHandlers
) {
  useEffect(() => {
    if (!userId) return;

    console.log(`Configurando subscription para o usuário ${userId}${boardId ? ` e quadro ${boardId}` : ''}`);

    // Criar um canal Supabase para escutar alterações na tabela tasks
    // para o usuário específico e opcionalmente para um quadro específico
    const channelFilter = boardId 
      ? `user_id=eq.${userId}&board_id=eq.${boardId}`
      : `user_id=eq.${userId}`;
      
    const channelName = boardId 
      ? `public:tasks:${userId}:${boardId}` 
      : `public:tasks:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: channelFilter
        },
        (payload) => {
          console.log('Evento Realtime (INSERT):', payload);
          
          // Converter o payload para o formato de Task
          const newTask: Task = {
            id: payload.new.id,
            title: payload.new.title,
            description: payload.new.description || '',
            status: payload.new.status,
            created_at: payload.new.created_at,
            updated_at: payload.new.updated_at || payload.new.created_at,
            due_date: payload.new.due_date,
            user_id: payload.new.user_id,
            board_id: payload.new.board_id || '',
          };
          
          if (handlers.onInsert) {
            console.log('Processando inserção em tempo real:', newTask.id);
            handlers.onInsert(newTask);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: channelFilter
        },
        (payload) => {
          console.log('Evento Realtime (UPDATE):', payload);
          
          // Converter o payload para o formato de Task
          const updatedTask: Task = {
            id: payload.new.id,
            title: payload.new.title,
            description: payload.new.description || '',
            status: payload.new.status,
            created_at: payload.new.created_at,
            updated_at: payload.new.updated_at || payload.new.created_at,
            due_date: payload.new.due_date,
            user_id: payload.new.user_id,
            board_id: payload.new.board_id || '',
          };
          
          if (handlers.onUpdate) {
            handlers.onUpdate(updatedTask);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: channelFilter
        },
        (payload) => {
          console.log('Evento Realtime (DELETE):', payload);
          
          if (handlers.onDelete && payload.old.id) {
            handlers.onDelete(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Status da subscription: ${status}`);
      });

    // Limpar a subscription quando o componente for desmontado
    return () => {
      console.log(`Removendo subscription para o usuário ${userId}`);
      supabase.removeChannel(channel);
    };
  }, [boardId, userId, handlers]);
}
