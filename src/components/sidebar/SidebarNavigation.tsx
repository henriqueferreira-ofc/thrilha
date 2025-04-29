
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Info, 
  LogOut 
} from 'lucide-react';

interface SidebarNavigationProps {
  onLogout: () => void;
}

export function SidebarNavigation({ onLogout }: SidebarNavigationProps) {
  const location = useLocation();
  
  const navigateTo = (path: string) => {
    window.location.replace(`#${path}`);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <Button 
        variant="ghost" 
        className={`justify-start hover:bg-white/5 ${location.pathname === "/tasks" ? "bg-white/5 text-purple-300" : ""}`}
        onClick={() => navigateTo('/tasks')}
      >
        <LayoutDashboard className="mr-2 h-4 w-4 text-purple-300" />
        Tarefas
      </Button>
      
      <Button 
        variant="ghost" 
        className={`justify-start hover:bg-white/5 ${location.pathname === "/calendar" ? "bg-white/5 text-purple-300" : ""}`}
        onClick={() => navigateTo('/calendar')}
      >
        <Calendar className="mr-2 h-4 w-4 text-purple-300" />
        Calendário
      </Button>
      
      <Button 
        variant="ghost" 
        className={`justify-start hover:bg-white/5 ${location.pathname === "/settings" ? "bg-white/5 text-purple-300" : ""}`}
        onClick={() => navigateTo('/settings')}
      >
        <Settings className="mr-2 h-4 w-4 text-purple-300" />
        Configurações
      </Button>
      
      <Button 
        variant="ghost" 
        className={`justify-start hover:bg-white/5 ${location.pathname === "/about" ? "bg-white/5 text-purple-300" : ""}`}
        onClick={() => navigateTo('/about')}
      >
        <Info className="mr-2 h-4 w-4 text-purple-300" />
        Sobre
      </Button>

      <div className="mt-auto">
        <Button 
          variant="ghost" 
          className="justify-start w-full hover:bg-white/5 text-red-400 hover:text-red-300"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
