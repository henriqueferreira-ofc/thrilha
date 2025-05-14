
import { useState } from 'react';
import { toast } from 'sonner';
import { Board, CreateBoardData } from '@/types/board';
import { supabase } from '@/supabase/client';

export function useBoardOperations(user: any | null, setBoards: React.Dispatch<React.SetStateAction<Board[]>>, currentBoard: Board | null, setCurrentBoard: React.Dispatch<React.SetStateAction<Board | null>>) {
  // Criar um novo quadro
  const createBoard = async (data: CreateBoardData): Promise<Board | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para criar quadros');
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
        const remainingBoards = await fetchUserBoards(user.id);
        setCurrentBoard(remainingBoards.length > 0 ? remainingBoards[0] : null);
      }
    } catch (error) {
      console.error('Erro ao arquivar quadro:', error);
      toast.error('Erro ao arquivar quadro');
    }
  };

  // Função auxiliar para buscar quadros do usuário
  const fetchUserBoards = async (userId: string): Promise<Board[]> => {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar quadros:', error);
      return [];
    }
    
    return data || [];
  };

  return {
    createBoard,
    updateBoard,
    archiveBoard
  };
}
