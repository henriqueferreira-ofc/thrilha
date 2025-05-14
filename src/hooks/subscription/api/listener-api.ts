
import { SubscriptionPlan } from '@/types/board';
import { supabase } from '@/supabase/client';

// Configurar listener para atualizações em tempo real
export function setupSubscriptionListener(userId: string, onUpdate: (data: SubscriptionPlan) => void, onDelete: () => void) {
  return supabase
    .channel('public:subscriptions')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public',
      table: 'subscriptions',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('Alteração em assinatura recebida:', payload);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        onUpdate(payload.new as SubscriptionPlan);
      } else if (payload.eventType === 'DELETE') {
        onDelete();
      }
    })
    .subscribe();
}
