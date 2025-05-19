
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
import { TaskFormData } from '@/types/task';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tasks, loading, addTask, updateTask, deleteTask, changeTaskStatus } = useTasks();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Verificar se o usuário está autenticado
  useEffect(() => {
    if (!user) {
      console.log('Usuário não autenticado, redirecionando para login');
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleCreateTask = async (data: TaskFormData) => {
    console.log(`Index - Criando nova tarefa`);
    
    const task = await addTask(data);
    
    if (task) {
      console.log(`Index - Tarefa criada com sucesso: ${task.id}`);
      toast.success('Tarefa criada com sucesso!');
    }
    
    setIsCreateDialogOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full mountain-pattern">
        <TaskSidebar onCreateTask={handleCreateTask} />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-sm bg-black/20">
            <h1 className="text-xl font-bold text-white">Tarefas</h1>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="purple-gradient-bg">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel sm:max-w-[425px]">
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
                <TaskForm onSubmit={handleCreateTask} />
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
                onDelete={deleteTask}
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
