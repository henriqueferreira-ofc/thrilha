
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Board } from '@/types/board';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useBoardOperations } from './use-board-operations';
import { useBoardSubscription } from './use-board-subscription';

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [canCreateMoreBoards, setCanCreateMoreBoards] = useState(true);
  const { user } = useAuth();

  // Importar operações de quadros
  const { createBoard, updateBoard, archiveBoard } = useBoardOperations(
    user, 
    setBoards, 
    currentBoard, 
    setCurrentBoard
  );

  // Configurar assinatura de atualizações em tempo real
  useBoardSubscription(
    user,
    boards,
    setBoards,
    currentBoard,
    setCurrentBoard,
    setCanCreateMoreBoards
  );

  // Carregar quadros do usuário
  useEffect(() => {
    if (!user) return;

    const fetchBoards = async () => {
      try {
        setLoading(true);
        
        // Buscar quadros do usuário
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('created_at', { ascending: false });

        if (boardsError) throw boardsError;
        
        // Buscar assinatura do usuário para verificar se pode criar mais quadros
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('plan_type')
          .eq('user_id', user.id)
          .single();
        
        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          throw subscriptionError;
        }

        // Verificar se o usuário pode criar mais quadros
        if (subscriptionData?.plan_type === 'pro') {
          setCanCreateMoreBoards(true);
        } else {
          // Se for plano gratuito, verificar se já atingiu o limite
          setCanCreateMoreBoards(boardsData.length < 3);
        }

        setBoards(boardsData || []);
        
        // Selecionar o primeiro quadro como padrão se houver e nenhum estiver selecionado
        if (boardsData && boardsData.length > 0 && !currentBoard) {
          setCurrentBoard(boardsData[0]);
        }
      } catch (error) {
        console.error('Erro ao buscar quadros:', error);
        toast.error('Erro ao carregar seus quadros');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [user, currentBoard]);

  return {
    boards,
    loading,
    currentBoard,
    setCurrentBoard,
    canCreateMoreBoards,
    createBoard,
    updateBoard,
    archiveBoard
  };
}
