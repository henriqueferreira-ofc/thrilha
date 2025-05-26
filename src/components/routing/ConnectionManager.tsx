
import { useEffect } from 'react';
import { supabase } from '@/supabase/client';

export function ConnectionManager() {
  useEffect(() => {
    // Quando o componente é montado, verificamos se há canais existentes para limpar
    const cleanup = () => {
      try {
        // Fechar todas as conexões do Supabase
        supabase.realtime.disconnect();
        console.log('Todas as conexões Supabase foram encerradas');
      } catch (err) {
        console.error('Erro ao limpar conexões:', err);
      }
    };

    // Adicionar event listeners para casos de fechamento de página
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);

    // Limpeza ao desmontar o componente
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
      cleanup();
    };
  }, []);

  return null; // Este componente não renderiza nada
}
