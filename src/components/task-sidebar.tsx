
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { TaskFormData } from '@/types/task';
import { useAuth } from '@/context/AuthContext';
import { SidebarProfile } from './sidebar/SidebarProfile';
import { SidebarNavigation } from './sidebar/SidebarNavigation';
import { TaskCreateDialog } from './sidebar/TaskCreateDialog';
import { useSidebarProfile } from '@/hooks/use-sidebar-profile';
import { useBoards } from '@/hooks/use-boards';

interface TaskSidebarProps {
  onCreateTask?: (data: TaskFormData) => void;
  hideDefaultTrigger?: boolean;
}

export function TaskSidebar({ onCreateTask, hideDefaultTrigger }: TaskSidebarProps) {
  const { user, signOut } = useAuth();
  const { avatarUrl, username, loading } = useSidebarProfile(user);
  const { currentBoard } = useBoards();

  const handleLogout = () => {
    void signOut();
  };

  const handleCreateTask = (data: TaskFormData) => {
    if (onCreateTask) {
      // Usar 'default' como valor padrão se não houver um quadro selecionado
      const taskData = {
        ...data,
        board_id: currentBoard?.id || 'default'
      };
      onCreateTask(taskData);
    }
  };

  return (
    <>
      {!hideDefaultTrigger && (
        <SidebarTrigger className="fixed top-4 left-4 z-40 md:hidden" />
      )}
      <Sidebar className="border-r border-white/10">
        <SidebarHeader className="flex flex-col items-center gap-2">
          <SidebarProfile 
            user={user} 
            loading={loading} 
          />
          {user && (
            <TaskCreateDialog 
              onCreateTask={handleCreateTask} 
            />
          )}
        </SidebarHeader>
        <SidebarContent className="flex flex-col gap-4">
          <SidebarNavigation onLogout={handleLogout} />
        </SidebarContent>
      </Sidebar>
    </>
  );
}
