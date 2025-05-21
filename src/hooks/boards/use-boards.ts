import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Board } from '@/types/board';
import { supabase } from '@/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useBoardOperations } from './use-board-operations';
import { useBoardSubscription } from './use-board-subscription';
import { useLocation } from 'react-router-dom';

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [canCreateMoreBoards, setCanCreateMoreBoards] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  // Importar operações de quadros
  const { createBoard, updateBoard, archiveBoard } = useBoardOperations(
    user, 
    setBoards, 
    currentBoard, 
    setCurrentBoard
  );

  // Função para criar um quadro padrão automaticamente
  const createDefaultBoard = async () => {
    if (!user) return null;
    
    console.log("Criando quadro padrão para novo usuário");
    try {
      const defaultBoard = await createBoard({ 
        name: "Meu Primeiro Quadro",
        description: "Quadro padrão criado automaticamente"
      });
      
      if (defaultBoard) {
        console.log("Quadro padrão criado com sucesso:", defaultBoard.id);
        return defaultBoard;
      }
    } catch (error) {
      console.error("Erro ao criar quadro padrão:", error);
    }
    return null;
  };

  // Função para obter ou criar um quadro padrão
  const getOrCreateDefaultBoard = async (): Promise<Board | null> => {
    if (!user) return null;

    try {
      // Primeiro, tenta encontrar um quadro existente
      const { data: existingBoards, error: fetchError } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;

      // Se encontrou um quadro, retorna ele
      if (existingBoards && existingBoards.length > 0) {
        return existingBoards[0];
      }

      // Se não encontrou, cria um novo
      return await createDefaultBoard();
    } catch (error) {
      console.error('Erro ao obter/criar quadro padrão:', error);
      return null;
    }
  };

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
        
        // Se não houver quadros, criar um padrão automaticamente
        if (boardsData.length === 0) {
          console.log("Nenhum quadro encontrado, criando quadro padrão");
          const defaultBoard = await createDefaultBoard();
          if (defaultBoard) {
            setCurrentBoard(defaultBoard);
            setBoards([defaultBoard]);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar quadros:', error);
        toast.error('Erro ao carregar seus quadros');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [user]);

  return {
    boards,
    loading,
    currentBoard,
    setCurrentBoard,
    canCreateMoreBoards,
    createBoard,
    updateBoard,
    archiveBoard,
    createDefaultBoard,
    getOrCreateDefaultBoard
  };
}
