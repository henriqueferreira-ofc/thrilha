
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Board, CreateBoardData } from '@/types/board';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [canCreateMoreBoards, setCanCreateMoreBoards] = useState(true);
  const { user } = useAuth();

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
  }, [user, currentBoard]);

  // Criar um novo quadro
  const createBoard = async (data: CreateBoardData): Promise<Board | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para criar quadros');
      return null;
    }

    if (!canCreateMoreBoards) {
      toast.error('Você atingiu o limite de quadros do plano gratuito. Faça upgrade para o plano Pro para criar mais quadros.');
      return null;
    }

    try {
      const { data: newBoard, error } = await supabase
        .from('boards')
        .insert({
          name: data.name,
          description: data.description || '',
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Quadro criado com sucesso!');
      return newBoard;
    } catch (error: any) {
      console.error('Erro ao criar quadro:', error);
      
      // Verificar erro específico de limite de quadros
      if (error.message?.includes('can_create_board')) {
        toast.error('Você atingiu o limite de quadros do plano gratuito. Faça upgrade para o plano Pro para criar mais quadros.');
      } else {
        toast.error('Erro ao criar quadro');
      }
      
      return null;
    }
  };

  // Atualizar um quadro existente
  const updateBoard = async (id: string, data: Partial<Board>): Promise<void> => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar quadros');
      return;
    }

    try {
      const { error } = await supabase
        .from('boards')
        .update({
          name: data.name,
          description: data.description
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Quadro atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar quadro:', error);
      toast.error('Erro ao atualizar quadro');
    }
  };

  // Arquivar um quadro
  const archiveBoard = async (id: string): Promise<void> => {
    if (!user) {
      toast.error('Você precisa estar logado para arquivar quadros');
      return;
    }

    try {
      const { error } = await supabase
        .from('boards')
        .update({ is_archived: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Quadro arquivado com sucesso!');
      
      // Se o quadro arquivado for o atual, selecionar outro
      if (currentBoard?.id === id) {
        const remainingBoards = boards.filter(board => board.id !== id);
        setCurrentBoard(remainingBoards.length > 0 ? remainingBoards[0] : null);
      }
    } catch (error) {
      console.error('Erro ao arquivar quadro:', error);
      toast.error('Erro ao arquivar quadro');
    }
  };

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
