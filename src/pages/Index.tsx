
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { TaskBoard } from '@/components/task-board';
import { useTasks } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { Plus, Mountain } from 'lucide-react';
import { useState } from 'react';

const Index = () => {
  const { tasks, addTask, updateTask, deleteTask, changeTaskStatus } = useTasks();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateTask = (data) => {
    addTask(data);
    setIsCreateDialogOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full mountain-pattern">
        <TaskSidebar onCreateTask={addTask} />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-sm bg-black/20">
            <div className="flex items-center gap-2">
              <Mountain className="h-5 w-5 text-purple-300" />
              <h1 className="text-xl font-bold purple-gradient-text">Minhas Tarefas</h1>
            </div>
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
            <TaskBoard
              tasks={tasks}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onChangeStatus={changeTaskStatus}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
