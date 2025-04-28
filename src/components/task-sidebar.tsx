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
  // Usar ref para controlar tentativas de inscrição do canal
  const isSettingUpChannel = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Função para navegar com verificação de autenticação
  const navigateTo = (path: string) => {
    // Redirecionar para o caminho solicitado
    window.location.replace(`#${path}`);
  };

  // Função para fazer logout e redirecionar para a página inicial
  const handleLogout = () => {
    try {
      signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Em caso de erro, usar forceLogout como fallback
      forceLogout();
    }
  };

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Adicionar um listener para mudanças no perfil
  useEffect(() => {
    if (!user) return;

    let channel;
    const setupChannel = async () => {
      try {
        // Limpar qualquer canal existente antes de criar um novo
        if (channel) {
          try {
            await supabase.removeChannel(channel);
            console.log('Canal anterior removido com sucesso (sidebar)');
          } catch (removeError) {
            console.warn('Erro ao remover canal anterior (sidebar):', removeError);
          }
        }

        channel = supabase
          .channel('profile-changes-sidebar')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload: RealtimePostgresChangesPayload<ProfilePayload>) => {
              try {
                const newProfile = payload.new as ProfilePayload;
                if (newProfile && newProfile.avatar_url !== undefined) {
                  const newUrl = newProfile.avatar_url + '?t=' + new Date().getTime();
                  console.log('Avatar atualizado via realtime (sidebar):', newUrl);
                  setAvatarUrl(newUrl);
                }
              } catch (error) {
                console.error('Erro ao processar payload do canal (sidebar):', error);
              }
            }
          );

        // Iniciar a assinatura do canal
        try {
          const status = await channel.subscribe((status) => {
            console.log(`Status do canal sidebar: ${status}`);
            if (status === 'CHANNEL_ERROR') {
              console.error('Erro no canal realtime sidebar, tentando reconectar...');
              setTimeout(() => setupChannel(), 5000);
            }
          });

          console.log('Status da inscrição sidebar:', status);
        } catch (subscribeError) {
          console.error('Erro ao inscrever no canal (sidebar):', subscribeError);
          // Tentar novamente após um tempo
          setTimeout(() => setupChannel(), 5000);
        }
      } catch (error) {
        console.error('Erro ao configurar canal realtime sidebar:', error);
        // Tentar novamente após um tempo
        setTimeout(() => setupChannel(), 5000);
      }
    };

    setupChannel();

    // Limpeza quando o componente é desmontado
    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(err => {
          console.error('Erro ao remover canal sidebar:', err);
        });
      }
    };
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Carregando perfil do usuário:', user.id);
      
      // Usar o helper para verificar/criar o perfil
      const { profile, isNew, error } = await getOrCreateProfile(user.id);
      
      if (error) {
        console.warn('Houve um erro, mas temos um perfil fallback:', error);
      }
      
      if (profile) {
        console.log(`Perfil ${isNew ? 'criado' : 'carregado'}:`, profile);
        
        // Atualizar username
        if (profile.username) {
          setUsername(profile.username);
        } else {
          // Fallback para email se username estiver vazio
          const defaultName = user.email 
            ? user.email.split('@')[0] 
            : `user_${user.id.substring(0, 8)}`;
          setUsername(defaultName);
        }
        
        // Atualizar avatar
        if (profile.avatar_url) {
          // Verificar se a URL já contém o caminho completo
          const avatarUrl = profile.avatar_url.startsWith('http') 
            ? profile.avatar_url 
            : `https://yieihrvcbshzmxieflsv.supabase.co/storage/v1/object/public/avatars/${profile.avatar_url}`;
          
          // Adicionar timestamp para evitar cache
          const avatarWithTimestamp = `${avatarUrl}?t=${new Date().getTime()}`;
          console.log('Avatar URL com timestamp:', avatarWithTimestamp);
          setAvatarUrl(avatarWithTimestamp);
        } else {
          setAvatarUrl(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar/criar perfil:', error);
      // Fallback para usar o email como nome de usuário
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
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Erro ao carregar imagem do avatar:', e);
                      const target = e.target as HTMLImageElement;
                      
                      // Logging da URL que falhou
                      console.log('URL que falhou:', target.src);
                      
                      // Tentar adicionar um novo timestamp à URL para evitar cache
                      if (target.src.includes('supabase') && !target.src.includes('retry')) {
                        console.log('Tentando recarregar com novo timestamp...');
                        const newTimestamp = new Date().getTime();
                        const newUrl = target.src.split('?')[0] + `?t=${newTimestamp}&retry=true`;
                        console.log('Nova URL com timestamp:', newUrl);
                        target.src = newUrl;
                        return;
                      }
                      
                      // Verificar se existe um avatar em localStorage
                      try {
                        const localAvatar = localStorage.getItem(`avatar_${user?.id}`);
                        if (localAvatar) {
                          console.log('Usando avatar local após erro');
                          target.src = localAvatar;
                          setAvatarUrl(localAvatar);
                          return;
                        }
                      } catch (localError) {
                        console.warn('Erro ao recuperar avatar local:', localError);
                      }
                      
                      // Se não houver avatar local, tentar usar DiceBear
                      if (user?.id) {
                        const diceBearUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`;
                        console.log('Usando avatar DiceBear:', diceBearUrl);
                        target.src = diceBearUrl;
                        setAvatarUrl(diceBearUrl);
                        return;
                      }
                      
                      // Se tudo falhar, limpar a URL e tentar recarregar o perfil
                      target.src = '';
                      setAvatarUrl(null);
                      
                      setTimeout(() => loadUserProfile(), 5000);
                    }}
                    loading="lazy"
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
