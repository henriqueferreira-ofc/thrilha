import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { TaskBoard } from '@/components/task-board';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/hooks/use-tasks';
import { TaskFormData, Task } from '@/types/task';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useBoards } from '@/hooks/use-boards';
import { useTaskCounter } from '@/hooks/tasks/use-task-counter';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/use-subscription';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tasks, loading, addTask, updateTask, deleteTask, changeTaskStatus } = useTasks();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { currentBoard, loading: loadingBoards } = useBoards();
  const { totalTasks, remainingTasks, totalLimit, limitReached, syncCompletedTasksCount } = useTaskCounter(currentBoard);
  const { isPro } = useSubscription();

  // Sincronizar o contador de tarefas ao carregar
  useEffect(() => {
    if (user && currentBoard) {
      syncCompletedTasksCount();
    }
  }, [user, currentBoard, syncCompletedTasksCount]);

  // Verificar se o usuário está autenticado
  useEffect(() => {
    if (!user) {
      console.log('Usuário não autenticado, redirecionando para login');
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      if (!data.board_id || data.board_id === 'default') {
        toast.error('Selecione um quadro antes de criar a tarefa.');
        return;
      }
      // Criar a tarefa
      const newTask = await addTask(data);

      if (newTask) {
        console.log('Tarefa criada com sucesso:', newTask.id);
        
        // Fechar o diálogo antes de atualizar o contador
        setIsCreateDialogOpen(false);
        
        // Atualizar o contador imediatamente
        await syncCompletedTasksCount();
        
        // Mostrar mensagem de sucesso
        toast.success('Tarefa criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa. Tente novamente.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      // Atualizar o contador imediatamente após a exclusão
      await syncCompletedTasksCount();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full mountain-pattern">
        <TaskSidebar onCreateTask={handleCreateTask} />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-sm bg-black/20">
            <div>
              <h1 className="text-xl font-bold text-white">
                {currentBoard ? currentBoard.name : 'Tarefas'}
                {loadingBoards && <span className="ml-2 text-sm text-purple-400">(Carregando quadros...)</span>}
              </h1>
              
              {/* Mostrar informações de limite apenas para usuários sem plano Pro */}
              {!isPro && (
                <div className="mt-2 text-sm flex items-center gap-2">
                  {!limitReached ? (
                    <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-500">
                      {totalTasks} de {totalLimit} tarefas
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-500/20 text-red-200 border-red-500">
                      Limite de tarefas atingido
                    </Badge>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    Tarefas disponíveis: {remainingTasks}
                  </div>
                </div>
              )}
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="purple-gradient-bg" 
                  disabled={!isPro && limitReached}
                  onClick={() => {
                    // Forçar sincronização do contador antes de mostrar o diálogo
                    syncCompletedTasksCount();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel sm:max-w-[425px]">
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
                <TaskForm 
                  onSubmit={handleCreateTask} 
                  boardId={currentBoard?.id || ''} 
                />
              </DialogContent>
            </Dialog>
          </header>
          
          <main className="flex-1 overflow-hidden p-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <TaskBoard
                tasks={tasks || []} 
                onDelete={handleDeleteTask}
                onUpdate={updateTask}
                onChangeStatus={changeTaskStatus}
              />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
