import { useState, useRef, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { User, Upload, Camera, Save, Moon, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { ErrorType } from '@/types/common';

// Definindo a interface para as preferências
interface UserPreferences {
  darkMode: boolean;
  compactMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  taskReminders: boolean;
}

// Definindo a interface para o perfil
interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  preferences?: UserPreferences;
  updated_at?: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Estados com tipos definidos
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [compactMode, setCompactMode] = useState<boolean>(false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [pushNotifications, setPushNotifications] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [taskReminders, setTaskReminders] = useState<boolean>(true);

  // Carregar dados do perfil quando o componente montar
  useEffect(() => {
    if (user) {
      // Carregar email do usuário
      setEmail(user.email || '');
      
      // Carregar nome de usuário do perfil
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setUsername(data.username || '');
        }
      };

      fetchProfile();

      // Carregar preferências quando o componente montar
      const loadPreferences = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (data?.preferences) {
          const prefs = data.preferences as UserPreferences;
          setDarkMode(prefs.darkMode ?? true);
          setCompactMode(prefs.compactMode ?? false);
          setEmailNotifications(prefs.emailNotifications ?? true);
          setPushNotifications(prefs.pushNotifications ?? false);
          setSoundEnabled(prefs.soundEnabled ?? true);
          setTaskReminders(prefs.taskReminders ?? true);
        }
      };

      loadPreferences();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Atualizar o perfil no Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Atualizar os metadados do usuário
      const { error: userError } = await supabase.auth.updateUser({
        email: email,
        data: { username }
      });

      if (userError) throw userError;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);

      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione uma imagem válida');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (userUpdateError) throw userUpdateError;

      toast.success('Foto de perfil atualizada com sucesso!');
      window.location.reload();

    } catch (error: ErrorType) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar foto de perfil');
    } finally {
      setIsUploading(false);
    }
  };

  // Função para salvar preferências de aparência
  const handleSaveAppearance = async (): Promise<void> => {
    if (!user) return;

    try {
      setIsSaving(true);
      const preferences: UserPreferences = {
        darkMode,
        compactMode,
        emailNotifications,
        pushNotifications,
        soundEnabled,
        taskReminders
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Preferências de aparência salvas!');
    } catch (error: ErrorType) {
      console.error('Erro ao salvar preferências:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar preferências');
    } finally {
      setIsSaving(false);
    }
  };

  // Função para salvar preferências de notificação
  const handleSaveNotifications = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const preferences: UserPreferences = {
        darkMode,
        compactMode,
        emailNotifications,
        pushNotifications,
        soundEnabled,
        taskReminders
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Preferências de notificação salvas!');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold">Configurações</h1>
          </header>
          
          <main className="flex-1 p-6">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="bg-black/60 border border-white/10">
                <TabsTrigger value="profile" className="data-[state=active]:bg-purple-500/20">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="appearance" className="data-[state=active]:bg-purple-500/20">
                  <Moon className="mr-2 h-4 w-4" />
                  Aparência
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-500/20">
                  <Bell className="mr-2 h-4 w-4" />
                  Notificações
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card className="bg-black/60 border border-white/10 mb-6">
                  <CardHeader>
                    <CardTitle>Foto de Perfil</CardTitle>
                    <CardDescription>
                      Clique na imagem ou no botão abaixo para alterar sua foto de perfil
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <Avatar 
                        className="h-32 w-32 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={handleAvatarClick}
                      >
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-purple-500/20 text-2xl">
                          {user?.email?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleAvatarClick}
                      disabled={isUploading}
                      className="bg-purple-500/10 border-purple-500/50 hover:bg-purple-500/20"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? 'Enviando...' : 'Alterar foto'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-black/60 border border-white/10">
                  <CardHeader>
                    <CardTitle>Informações do Perfil</CardTitle>
                    <CardDescription>
                      Atualize suas informações pessoais aqui.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de usuário</Label>
                      <Input 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="Seu nome de usuário" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="Seu email" 
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving}
                      className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance">
                <Card className="bg-black/60 border border-white/10">
                  <CardHeader>
                    <CardTitle>Aparência</CardTitle>
                    <CardDescription>
                      Personalize a aparência do aplicativo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dark-mode">Modo escuro</Label>
                        <p className="text-sm text-muted-foreground">
                          Ative para usar o tema escuro no aplicativo.
                        </p>
                      </div>
                      <Switch 
                        id="dark-mode" 
                        checked={darkMode} 
                        onCheckedChange={setDarkMode} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="compact-mode">Modo compacto</Label>
                        <p className="text-sm text-muted-foreground">
                          Reduz o espaçamento entre elementos para mostrar mais conteúdo.
                        </p>
                      </div>
                      <Switch
                        id="compact-mode"
                        checked={compactMode}
                        onCheckedChange={setCompactMode}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleSaveAppearance}
                      disabled={isSaving}
                      className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Salvando...' : 'Salvar preferências'}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card className="bg-black/60 border border-white/10">
                  <CardHeader>
                    <CardTitle>Notificações</CardTitle>
                    <CardDescription>
                      Configure suas preferências de notificação.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Notificações por email</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba atualizações importantes por email.
                        </p>
                      </div>
                      <Switch 
                        id="email-notifications" 
                        checked={emailNotifications} 
                        onCheckedChange={setEmailNotifications} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">Notificações push</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba notificações no navegador.
                        </p>
                      </div>
                      <Switch 
                        id="push-notifications" 
                        checked={pushNotifications} 
                        onCheckedChange={setPushNotifications} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sound-enabled">Sons de notificação</Label>
                        <p className="text-sm text-muted-foreground">
                          Ative ou desative sons para notificações.
                        </p>
                      </div>
                      <Switch 
                        id="sound-enabled" 
                        checked={soundEnabled} 
                        onCheckedChange={setSoundEnabled} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="task-reminders">Lembretes de tarefas</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba lembretes para tarefas próximas do prazo.
                        </p>
                      </div>
                      <Switch
                        id="task-reminders"
                        checked={taskReminders}
                        onCheckedChange={setTaskReminders}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleSaveNotifications} 
                      disabled={isSaving}
                      className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Salvando...' : 'Salvar preferências'}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
