import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TaskForm } from '@/components/task-form';
import { TaskFormData } from '@/types/task';
import { PlusCircle, LayoutDashboard, Calendar, Settings, Info, Mountain, LogOut, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '../supabase/client';
import { getOrCreateProfile } from '../supabase/helper';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { AvatarUpload } from "@/components/AvatarUpload";

interface TaskSidebarProps {
  onCreateTask?: (data: TaskFormData) => void;
}

interface ProfilePayload {
  id: string;
  avatar_url: string | null;
  username?: string;
  updated_at?: string;
  full_name?: string | null;
  website?: string | null;
}

export function TaskSidebar({ onCreateTask }: TaskSidebarProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, forceLogout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const isSettingUpChannel = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const navigateTo = (path: string) => {
    window.location.replace(`#${path}`);
  };

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

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (!user || isSettingUpChannel.current) return;

    isSettingUpChannel.current = true;

    const setupChannel = async () => {
      try {
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current).catch(e => {
            console.warn('Erro ao remover canal existente:', e);
          });
          channelRef.current = null;
        }

        const channelId = `profile-changes-${user.id.slice(0, 8)}-${Date.now()}`;
        console.log('Criando canal com ID:', channelId);

        channelRef.current = supabase
          .channel(channelId)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload: RealtimePostgresChangesPayload<ProfilePayload>) => {
              console.log('Recebida atualização de perfil:', payload);
              
              const newProfile = payload.new as ProfilePayload;
              if (newProfile && newProfile.avatar_url) {
                const newUrl = newProfile.avatar_url + '?t=' + new Date().getTime();
                setAvatarUrl(newUrl);
                
                if (newProfile.username) {
                  setUsername(newProfile.username);
                }
              } else {
                loadUserProfile();
              }
            }
          );

        try {
          await channelRef.current.subscribe();
          console.log('Canal inscrito com sucesso:', channelId);
        } catch (err) {
          console.error('Erro ao inscrever no canal:', err);
          
          channelRef.current = null;
          isSettingUpChannel.current = false;
          
          setTimeout(() => setupChannel(), 5000);
        }
      } catch (error) {
        console.error('Erro ao configurar canal realtime:', error);
        isSettingUpChannel.current = false;
      }
    };

    setupChannel();

    return () => {
      if (channelRef.current) {
        console.log('Removendo canal:', channelRef.current.topic);
        supabase.removeChannel(channelRef.current).catch(err => {
          console.error('Erro ao remover canal sidebar:', err);
        });
        channelRef.current = null;
      }
      isSettingUpChannel.current = false;
    };
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Carregando perfil do usuário:', user.id);
      
      const { profile, isNew, error } = await getOrCreateProfile(user.id);
      
      if (error) {
        console.warn('Houve um erro, mas temos um perfil fallback:', error);
      }
      
      if (profile) {
        console.log(`Perfil ${isNew ? 'criado' : 'carregado'}:`, profile);
        
        if (profile.username) {
          setUsername(profile.username);
        } else {
          const defaultName = user.email 
            ? user.email.split('@')[0] 
            : `user_${user.id.substring(0, 8)}`;
          setUsername(defaultName);
        }
        
        if (profile.avatar_url) {
          const avatarWithTimestamp = profile.avatar_url + '?t=' + new Date().getTime();
          console.log('Avatar URL com timestamp:', avatarWithTimestamp);
          setAvatarUrl(avatarWithTimestamp);
        } else {
          setAvatarUrl(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar/criar perfil:', error);
      if (user?.email) {
        setUsername(user.email.split('@')[0]);
      } else if (user?.id) {
        setUsername(`user_${user.id.substring(0, 8)}`);
      } else {
        setUsername('Usuário');
      }
      setAvatarUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = (data: TaskFormData) => {
    if (onCreateTask) {
      onCreateTask(data);
    }
    setIsCreateDialogOpen(false);
  };

  const handleAvatarUrlChange = (url: string) => {
    setAvatarUrl(url);
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
            <div className="flex flex-col items-center gap-2 w-full mt-2">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                onAvatarChange={handleAvatarUrlChange}
                size="sm"
              />
              {!loading && username && (
                <p className="text-sm font-medium text-purple-300">
                  {username}
                </p>
              )}
            </div>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 mt-4" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="create-task-description">
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
              <p id="create-task-description" className="sr-only">
                Formulário para criar uma nova tarefa
              </p>
              <TaskForm onSubmit={handleCreateTask} />
            </DialogContent>
          </Dialog>
        </SidebarHeader>
        <SidebarContent className="flex flex-col gap-4">
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
              onClick={handleLogout}
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
