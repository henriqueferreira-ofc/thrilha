
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { TaskFormData } from '@/types/task';
import { useAuth } from '@/context/AuthContext';
import { SidebarProfile } from './sidebar/SidebarProfile';
import { SidebarNavigation } from './sidebar/SidebarNavigation';
import { TaskCreateDialog } from './sidebar/TaskCreateDialog';
import { useSidebarProfile } from '@/hooks/use-sidebar-profile';

interface TaskSidebarProps {
  onCreateTask?: (data: TaskFormData) => void;
}

export function TaskSidebar({ onCreateTask }: TaskSidebarProps) {
  const { user, signOut } = useAuth();
  const { avatarUrl, username, loading } = useSidebarProfile(user);

  const handleLogout = () => {
    try {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      localStorage.removeItem('sb-yieihrvcbshzmxieflsv-auth-token');
      sessionStorage.clear();
      
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=').map(c => c.trim());
        if (name.includes('supabase') || name.includes('sb-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      window.location.href = "/";
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      window.location.href = "/";
    }
  };

  const handleCreateTask = (data: TaskFormData) => {
    if (onCreateTask) {
      onCreateTask(data);
    }
  };

  return (
    <>
      <SidebarTrigger className="absolute top-4 left-4 z-40 md:hidden" />
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
