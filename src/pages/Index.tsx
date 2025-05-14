import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { TaskBoard } from '@/components/task-board';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { Plus, Mountain, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBoards } from '@/hooks/boards';
import { useTasksBoard } from '@/hooks/use-tasks-board';
import { useTaskOperationsBoard } from '@/hooks/tasks/use-task-operations-board';
import { BoardSelector } from '@/components/boards/board-selector';
import { TaskFormData } from '@/types/task';
import { TaskProgress } from '@/components/task-progress';
import { useSubscription } from '@/hooks/use-subscription';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTaskCounter } from '@/hooks/tasks/use-task-counter';

const Index = () => {
  const { user } = useAuth();
  const { 
    boards, 
    currentBoard, 
    setCurrentBoard, 
    canCreateMoreBoards, 
    createBoard 
  } = useBoards();
  
  const { tasks, loading, setTasks } = useTasksBoard(currentBoard);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { isPro } = useSubscription();
  const { limitReached, syncCompletedTasksCount } = useTaskCounter();

  // Sincronizar o contador de tarefas concluídas quando as tarefas são carregadas
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      console.log(`Index - Sincronizando contador com ${tasks.length} tarefas carregadas`);
      syncCompletedTasksCount();
    }
  }, [tasks, syncCompletedTasksCount]);

  // Importar as operações específicas do quadro
  const { addTask, updateTask, deleteTask, changeTaskStatus } = useTaskOperationsBoard(
    tasks,
    setTasks,
    currentBoard
  );

  const handleCreateTask = async (data: TaskFormData) => {
    if (!currentBoard) {
      return;
    }
    
    console.log(`Index - Criando nova tarefa no quadro ${currentBoard.id}`);
    
    // Agora incluímos o board_id na criação da tarefa
    const task = await addTask({
      ...data,
      board_id: currentBoard.id
    });
    
    if (task) {
      console.log(`Index - Tarefa criada com sucesso: ${task.id}`);
    }
    
    setIsCreateDialogOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full mountain-pattern">
        <TaskSidebar onCreateTask={handleCreateTask} currentBoard={currentBoard} />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-sm bg-black/20">
            <h1 className="text-xl font-bold text-white">Tarefas</h1>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="purple-gradient-bg"
                  disabled={!currentBoard || limitReached}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel sm:max-w-[425px]">
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
                <TaskForm onSubmit={handleCreateTask} boardId={currentBoard?.id} />
              </DialogContent>
            </Dialog>
          </header>
          
          <main className="flex-1 overflow-hidden p-4">
            {currentBoard ? (
              <>
                {/* Mostrar indicador de progresso apenas para usuários do plano gratuito */}
                {!isPro && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-300">Plano Gratuito</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>No plano gratuito, você pode ter apenas 3 tarefas concluídas. Faça upgrade para o plano Pro para tarefas concluídas ilimitadas.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <TaskProgress />
                  </div>
                )}
                
                <TaskBoard
                  tasks={tasks || []} 
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  onChangeStatus={changeTaskStatus}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <h2 className="text-xl font-semibold mb-2">Nenhum quadro selecionado</h2>
                <p className="text-gray-500 mb-4">
                  Selecione ou crie um quadro para começar a gerenciar suas tarefas.
                </p>
                {boards && boards.length === 0 && canCreateMoreBoards && (
                  <Button onClick={() => {
                    const name = prompt('Nome do quadro:');
                    if (name) createBoard({ name });
                  }}>
                    Criar Primeiro Quadro
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
