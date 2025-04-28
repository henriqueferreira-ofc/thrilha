import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as LucideUser, LogOut, Moon, Sun, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/components/ui/theme-provider';
import { useAuth } from '@/context/AuthContext';
import { TaskSidebar } from './task-sidebar';

export function Header() {
  const { setTheme, theme } = useTheme();
  const { user, signOut, forceLogout } = useAuth();
  const navigate = useNavigate();
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Tentar obter o avatar do perfil no Supabase
    const loadAvatar = async () => {
      if (!user) return;
      
      try {
        // Verificar se há um avatar em localStorage primeiro (mais rápido)
        try {
          const localAvatar = localStorage.getItem(`avatar_${user.id}`);
          if (localAvatar) {
            console.log('Header: Usando avatar local');
            setAvatarUrl(localAvatar);
            return;
          }
        } catch (localError) {
          console.warn('Header: Erro ao buscar avatar local:', localError);
        }
        
        // Tentar usar avatar dos metadados do usuário
        if (user.user_metadata?.avatar_url) {
          console.log('Header: Usando avatar dos metadados');
          const avatarWithTimestamp = user.user_metadata.avatar_url + '?t=' + new Date().getTime();
          setAvatarUrl(avatarWithTimestamp);
          return;
        }
        
        // Se nada funcionar, usar DiceBear como fallback
        const diceBearUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`;
        setAvatarUrl(diceBearUrl);
      } catch (error) {
        console.error('Header: Erro ao carregar avatar:', error);
      }
    };
    
    loadAvatar();
  }, [user]);

  const handleLogout = () => {
    try {
      signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Em caso de erro, usar forceLogout como fallback
      forceLogout();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b flex items-center justify-between px-4 h-14">
      <div className="flex items-center">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <TaskSidebar onCreateTask={() => {}} />
            </SheetContent>
          </Sheet>
        )}
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">Trilha</span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={avatarUrl || ''} 
                    alt="User avatar" 
                    onError={(e) => {
                      console.error('Header: Erro ao carregar avatar:', e);
                      if (user?.id) {
                        const fallbackUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`;
                        (e.target as HTMLImageElement).src = fallbackUrl;
                      }
                    }}
                  />
                  <AvatarFallback>
                    <LucideUser className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <LucideUser className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
            Login
          </Button>
        )}
      </div>
    </header>
  );
} 