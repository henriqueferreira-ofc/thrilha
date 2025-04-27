import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TaskForm } from '@/components/task-form';
import { TaskFormData } from '@/types/task';
import { PlusCircle, LayoutDashboard, Calendar, Settings, Info, Mountain, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '../supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Adicionar um listener para mudanças no perfil
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<ProfilePayload>) => {
          // Força a limpeza do cache de imagem adicionando timestamp
          const newProfile = payload.new as ProfilePayload;
          if (newProfile && newProfile.avatar_url) {
            const newUrl = newProfile.avatar_url + '?t=' + new Date().getTime();
            setAvatarUrl(newUrl);
          } else {
            loadUserProfile();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Carregando perfil do usuário:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        throw error;
      }

      if (data) {
        console.log('Dados do perfil carregados:', data);
        // Só atualiza o username se houver um valor
        if (data.username) {
          setUsername(data.username);
        }
        
        // Adicionar timestamp à URL para evitar cache
        if (data.avatar_url) {
          const avatarWithTimestamp = data.avatar_url + '?t=' + new Date().getTime();
          console.log('Avatar URL com timestamp:', avatarWithTimestamp);
          setAvatarUrl(avatarWithTimestamp);
        } else {
          setAvatarUrl(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
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
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border-2 border-purple-400 flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl + '?t=' + new Date().getTime()} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Erro ao carregar imagem:', e);
                      const target = e.target as HTMLImageElement;
                      target.src = '';
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
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
