
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TaskForm } from '@/components/task-form';
import { TaskFormData } from '@/types/task';
import { PlusCircle, LayoutDashboard, Calendar, Settings, Info } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface TaskSidebarProps {
  onCreateTask?: (data: TaskFormData) => void;
}

export function TaskSidebar({ onCreateTask }: TaskSidebarProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const location = useLocation();

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
          <h1 className="text-xl font-bold text-gradient">VO</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="sm">
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
            className="justify-start" 
            asChild
          >
            <Link to="/">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start" 
            asChild
          >
            <Link to="/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendário
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className="justify-start" 
            asChild
          >
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </Button>
          
          <Button variant="ghost" className="justify-start">
            <Info className="mr-2 h-4 w-4" />
            Sobre
          </Button>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
