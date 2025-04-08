
import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Moon, User, Save } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const handleSaveProfile = () => {
    toast.success("Perfil salvo com sucesso!");
  };
  
  const handleSaveTheme = () => {
    toast.success("Configurações de tema salvas!");
  };
  
  const handleSaveNotifications = () => {
    toast.success("Preferências de notificação atualizadas!");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-sm bg-black/50">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-purple-400 to-purple-300 bg-clip-text text-transparent">
              Configurações
            </h1>
          </header>
          
          <main className="flex-1 p-6">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="bg-black/60 border border-white/10">
                <TabsTrigger value="profile" className="data-[state=active]:bg-purple-500/20">
                  <User className="mr-2 h-4 w-4 text-purple-300" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="appearance" className="data-[state=active]:bg-purple-500/20">
                  <Moon className="mr-2 h-4 w-4 text-purple-300" />
                  Aparência
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-500/20">
                  <Bell className="mr-2 h-4 w-4 text-purple-300" />
                  Notificações
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card className="bg-black/60 border border-white/10 shadow-lg shadow-purple-500/10">
                  <CardHeader>
                    <CardTitle className="text-gradient">Informações do Perfil</CardTitle>
                    <CardDescription>Atualize suas informações pessoais aqui.</CardDescription>
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
                      className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar alterações
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance">
                <Card className="bg-black/60 border border-white/10 shadow-lg shadow-purple-500/10">
                  <CardHeader>
                    <CardTitle className="text-gradient">Aparência</CardTitle>
                    <CardDescription>Personalize a aparência do Trilha.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dark-mode">Modo escuro</Label>
                        <p className="text-sm text-muted-foreground">
                          Ative o modo escuro para melhor visualização noturna.
                        </p>
                      </div>
                      <Switch 
                        id="dark-mode" 
                        checked={darkMode} 
                        onCheckedChange={setDarkMode} 
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleSaveTheme} 
                      className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar preferências
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card className="bg-black/60 border border-white/10 shadow-lg shadow-purple-500/10">
                  <CardHeader>
                    <CardTitle className="text-gradient">Notificações</CardTitle>
                    <CardDescription>Configure como você deseja receber notificações.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Notificações por Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba notificações importantes por email.
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
                        <Label htmlFor="push-notifications">Notificações Push</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba notificações push no seu navegador.
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
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleSaveNotifications} 
                      className="ml-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar notificações
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
