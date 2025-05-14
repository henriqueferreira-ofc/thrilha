
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
  handlers: RealtimeHandlers
) {
  useEffect(() => {
    if (!boardId) return;

    console.log(`Configurando subscription para o quadro ${boardId}`);

    // Criar um canal Supabase para escutar alterações na tabela tasks
    const channel = supabase
      .channel(`public:tasks:board_id=eq.${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `board_id=eq.${boardId}`,
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
            board_id: payload.new.board_id,
          };
          
          // Ignorar tarefas com IDs temporários (nossa aplicação já lidou com elas)
          if (newTask.id.startsWith('temp-')) {
            console.log('Ignorando tarefa temporária:', newTask.id);
            return;
          }
          
          if (handlers.onInsert) {
            // Verificamos se é uma tarefa remota antes de inserir
            console.log('Processando inserção remota:', newTask.id);
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
          filter: `board_id=eq.${boardId}`,
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
            board_id: payload.new.board_id,
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
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('Evento Realtime (DELETE):', payload);
          
          if (handlers.onDelete && payload.old.id) {
            handlers.onDelete(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Status da subscription para o quadro ${boardId}:`, status);
      });

    // Limpar a subscription quando o componente for desmontado
    return () => {
      console.log(`Removendo subscription para o quadro ${boardId}`);
      supabase.removeChannel(channel);
    };
  }, [boardId, handlers]);
}
