
import { useEffect } from 'react';
import { supabase } from '@/supabase/client';
import { Board } from '@/types/board';

export function useBoardSubscription(
  user: any | null, 
  boards: Board[], 
  setBoards: React.Dispatch<React.SetStateAction<Board[]>>, 
  currentBoard: Board | null, 
  setCurrentBoard: React.Dispatch<React.SetStateAction<Board | null>>,
  setCanCreateMoreBoards: React.Dispatch<React.SetStateAction<boolean>>
) {
  useEffect(() => {
    if (!user) return;

    // Configurar listener para atualizações em tempo real
    const boardsSubscription = supabase
      .channel('public:boards')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'boards',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Alteração em boards recebida:', payload);
        
        if (payload.eventType === 'INSERT') {
          setBoards(prev => [payload.new as Board, ...prev]);
          // Verificar limite de criação
          if (payload.new.plan_type !== 'pro') {
            setCanCreateMoreBoards(prev => prev && boards.length < 2); // já contando o novo
          }
        } else if (payload.eventType === 'UPDATE') {
          setBoards(prev => 
            prev.map(board => board.id === payload.new.id ? (payload.new as Board) : board)
          );
          // Atualizar o quadro atual se for o mesmo
          if (currentBoard?.id === payload.new.id) {
            setCurrentBoard(payload.new as Board);
          }
        } else if (payload.eventType === 'DELETE') {
          setBoards(prev => 
            prev.filter(board => board.id !== payload.old.id)
          );
          // Se o quadro atual foi excluído, selecionar outro
          if (currentBoard?.id === payload.old.id) {
            setCurrentBoard(boards.length > 0 ? boards[0] : null);
          }
          // Atualizar limite de criação
          if (payload.old.plan_type !== 'pro') {
            setCanCreateMoreBoards(prev => true); // Agora tem um espaço livre
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(boardsSubscription);
    };
  }, [user, boards, currentBoard, setBoards, setCurrentBoard, setCanCreateMoreBoards]);
}
