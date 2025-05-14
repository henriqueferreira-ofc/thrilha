
import { useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { Task } from '@/types/task';

interface RealtimeHandlers {
  onInsert?: (newTask: Task) => void;
  onUpdate?: (updatedTask: Task) => void; 
  onDelete?: (deletedTaskId: string) => void;
}

/**
 * Hook para se inscrever em atualizações em tempo real da tabela tasks
 */
export function useRealtimeSubscription(
  boardId: string | undefined,
  handlers: RealtimeHandlers
) {
  useEffect(() => {
    if (!boardId) {
      console.log('useRealtimeSubscription: boardId não fornecido, pulando inscrição');
      return;
    }

    console.log(`Configurando assinatura em tempo real para o quadro ${boardId}`);
    
    // Criar um canal específico para este quadro
    const tasksSubscription = supabase
      .channel(`tasks-board-${boardId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public',
        table: 'tasks',
        filter: `board_id=eq.${boardId}`
      }, (payload) => {
        console.log('Evento em tempo real - Nova tarefa detectada:', payload);
        if (handlers.onInsert) {
          try {
            const newTask = payload.new as Task;
            handlers.onInsert(newTask);
          } catch (error) {
            console.error('Erro ao processar nova tarefa:', error);
          }
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'tasks',
        filter: `board_id=eq.${boardId}`
      }, (payload) => {
        console.log('Evento em tempo real - Tarefa atualizada:', payload);
        if (handlers.onUpdate) {
          try {
            const updatedTask = payload.new as Task;
            handlers.onUpdate(updatedTask);
          } catch (error) {
            console.error('Erro ao processar atualização de tarefa:', error);
          }
        }
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'tasks',
        filter: `board_id=eq.${boardId}`
      }, (payload) => {
        console.log('Evento em tempo real - Tarefa excluída:', payload);
        if (handlers.onDelete) {
          try {
            const oldData = payload.old as { id: string };
            handlers.onDelete(oldData.id);
          } catch (error) {
            console.error('Erro ao processar exclusão de tarefa:', error);
          }
        }
      })
      .subscribe((status) => {
        console.log(`Status da inscrição em tempo real para o quadro ${boardId}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`Inscrição ativa para o quadro ${boardId}`);
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.error(`Erro na inscrição em tempo real: ${status}`);
          
          // Tentar reconectar após um breve atraso
          setTimeout(() => {
            console.log('Tentando reconectar...');
            tasksSubscription.subscribe();
          }, 3000);
        }
      });

    // Limpar inscrição quando o componente for desmontado
    return () => {
      console.log(`Removendo inscrição em tempo real para o quadro ${boardId}`);
      supabase.removeChannel(tasksSubscription);
    };
  }, [boardId, handlers]);
}
