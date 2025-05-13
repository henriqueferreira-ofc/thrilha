
import { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Board } from '@/types/board';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NewBoardDialog } from './new-board-dialog';
import { PlusCircle } from 'lucide-react';

interface BoardSelectorProps {
  boards: Board[];
  currentBoard: Board | null;
  onBoardChange: (board: Board) => void;
  canCreateMoreBoards: boolean;
  onCreateBoard: (data: { name: string; description?: string }) => Promise<Board | null>;
}

export function BoardSelector({
  boards,
  currentBoard,
  onBoardChange,
  canCreateMoreBoards,
  onCreateBoard
}: BoardSelectorProps) {
  const [isNewBoardDialogOpen, setIsNewBoardDialogOpen] = useState(false);

  const handleCreateBoard = async (data: { name: string; description?: string }) => {
    const newBoard = await onCreateBoard(data);
    if (newBoard) {
      onBoardChange(newBoard);
      setIsNewBoardDialogOpen(false);
    }
  };

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Você não possui nenhum quadro. Crie seu primeiro quadro para começar.
        </p>
        <Button onClick={() => setIsNewBoardDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Quadro
        </Button>
        <NewBoardDialog 
          open={isNewBoardDialogOpen} 
          onOpenChange={setIsNewBoardDialogOpen}
          onSubmit={handleCreateBoard}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={currentBoard?.id || ""}
        onValueChange={(value) => {
          const selectedBoard = boards.find(board => board.id === value);
          if (selectedBoard) {
            onBoardChange(selectedBoard);
          }
        }}
      >
        <SelectTrigger className="w-[180px] md:w-[240px]">
          <SelectValue placeholder="Selecione um quadro" />
        </SelectTrigger>
        <SelectContent>
          {boards.map((board) => (
            <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            variant="outline"
            disabled={!canCreateMoreBoards}
            title={!canCreateMoreBoards ? "Limite de quadros atingido no plano gratuito" : "Criar novo quadro"}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          {canCreateMoreBoards ? (
            <>
              <h3 className="font-medium mb-2">Criar novo quadro</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Organize suas tarefas em diferentes quadros para diferentes projetos ou áreas.
              </p>
              <Button 
                className="w-full" 
                onClick={() => setIsNewBoardDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Quadro
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-medium mb-2">Limite de quadros atingido</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Você atingiu o limite de 3 quadros do plano gratuito. Faça upgrade para o plano Pro para criar quadros ilimitados.
              </p>
              <Button 
                className="w-full" 
                variant="default"
                onClick={() => window.location.href = "/settings"}
              >
                Fazer Upgrade
              </Button>
            </>
          )}
        </PopoverContent>
      </Popover>

      <NewBoardDialog 
        open={isNewBoardDialogOpen} 
        onOpenChange={setIsNewBoardDialogOpen}
        onSubmit={handleCreateBoard}
      />
    </div>
  );
}
