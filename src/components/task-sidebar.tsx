
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TaskForm } from '@/components/task-form';
import { TaskFormData } from '@/types/task';
import { PlusCircle, LayoutDashboard, Calendar, Settings, Info, Mountain, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface TaskSidebarProps {
  onCreateTask?: (data: TaskFormData) => void;
}

export function TaskSidebar({ onCreateTask }: TaskSidebarProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleCreateTask = (data: TaskFormData) => {
    if (onCreateTask) {
      onCreateTask(data);
    }
    setIsCreateDialogOpen(false);
  };

  return (
    <>
      <SidebarTrigger className="absolute top-4 left-4 z-40 md:hidden" />
      <Sidebar className="border-r border-white/10">
        <SidebarHeader className="flex flex-col items-center gap-2 py-6">
          <div className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-purple-300" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-purple-400 to-purple-300 bg-clip-text text-transparent">
              Trilha
            </h1>
          </div>
          {user && (
            <div className="w-full mt-2 text-center">
              <p className="text-sm text-purple-300 truncate px-2">{user.email}</p>
            </div>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel sm:max-w-[425px]">
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
              <TaskForm onSubmit={handleCreateTask} />
            </DialogContent>
          </Dialog>
        </SidebarHeader>
        <SidebarContent className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            className="justify-start hover:bg-white/5" 
            asChild
          >
            <Link to="/tasks">
              <LayoutDashboard className="mr-2 h-4 w-4 text-purple-300" />
              Tarefas
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start hover:bg-white/5" 
            asChild
          >
            <Link to="/calendar">
              <Calendar className="mr-2 h-4 w-4 text-purple-300" />
              Calendário
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start hover:bg-white/5" 
            asChild
          >
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4 text-purple-300" />
              Configurações
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start hover:bg-white/5" 
            asChild
          >
            <Link to="/about">
              <Info className="mr-2 h-4 w-4 text-purple-300" />
              Sobre
            </Link>
          </Button>

          <div className="mt-auto">
            <Button 
              variant="ghost" 
              className="justify-start w-full hover:bg-white/5 text-red-400 hover:text-red-300"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
