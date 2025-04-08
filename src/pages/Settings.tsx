import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase';
import { toast } from 'sonner';
import { UserPreferences } from '@/types/common';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Moon, Sun, Volume2, VolumeX, Bell, BellOff, Mail, MailX, CalendarClock, Calendar } from 'lucide-react';

// As preferências padrão do usuário
const defaultPreferences: UserPreferences = {
  darkMode: true,
  compactMode: false,
  soundEnabled: true,
  pushNotifications: false,
  emailNotifications: true,
  taskReminders: true
};

const Settings = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  
  // Carrega as preferências do usuário quando o componente é montado
  useEffect(() => {
    loadUserPreferences();
  }, [user]);
  
  // Carregar as preferências do usuário do Supabase
  const loadUserPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences, username')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      // Se o usuário tiver preferências salvas, use-as
      // Caso contrário, use as preferências padrão
      if (data) {
        // Aqui está a correção do tipo
        const userPrefs = data.preferences as Record<string, unknown>;
        
        // Combinamos com as preferências padrão para garantir que todos os campos existam
        setPreferences({
          ...defaultPreferences,
          ...(userPrefs as unknown as UserPreferences)
        });
        
        setUsername(data.username || '');
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar preferências:', error);
      toast.error('Não foi possível carregar suas preferências');
    } finally {
      setLoading(false);
    }
  };
  
  // Salvar uma preferência específica
  const saveUserPreference = async (key: string, value: boolean) => {
    if (!user) return;
    
    // Atualizar estado local imediatamente para uma resposta instantânea na UI
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    try {
      setSaving(true);
      
      // Criar um objeto com as preferências atualizadas
      const updatedPreferences = {
        ...preferences,
        [key]: value
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPreferences as unknown as Record<string, unknown>
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Preferência atualizada com sucesso');
    } catch (error: unknown) {
      console.error('Erro ao salvar preferência:', error);
      toast.error('Não foi possível salvar sua preferência');
      
      // Reverter alteração em caso de erro
      setPreferences(prev => ({
        ...prev,
        [key]: !value
      }));
    } finally {
      setSaving(false);
    }
  };
  
  // Salvar o nome de usuário
  const saveUsername = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Nome de usuário atualizado com sucesso');
    } catch (error: unknown) {
      console.error('Erro ao salvar nome de usuário:', error);
      toast.error('Não foi possível salvar seu nome de usuário');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="account" className="w-[400px] mx-auto">
        <TabsList>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Gerencie as informações da sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Nome de usuário</Label>
                <Input 
                  type="text" 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveUsername} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Nome de Usuário'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do aplicativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="darkMode">Modo Escuro</Label>
                <Switch 
                  id="darkMode" 
                  checked={preferences.darkMode} 
                  onCheckedChange={(checked) => saveUserPreference('darkMode', checked)}
                  disabled={loading || saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="compactMode">Modo Compacto</Label>
                <Switch 
                  id="compactMode" 
                  checked={preferences.compactMode} 
                  onCheckedChange={(checked) => saveUserPreference('compactMode', checked)}
                  disabled={loading || saving}
                />
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Selecione como você prefere que o site apareça.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Gerencie suas preferências de notificação.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">Notificações por Email</Label>
                <Switch 
                  id="emailNotifications" 
                  checked={preferences.emailNotifications} 
                  onCheckedChange={(checked) => saveUserPreference('emailNotifications', checked)}
                  disabled={loading || saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pushNotifications">Notificações Push</Label>
                <Switch 
                  id="pushNotifications" 
                  checked={preferences.pushNotifications} 
                  onCheckedChange={(checked) => saveUserPreference('pushNotifications', checked)}
                  disabled={loading || saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="soundEnabled">Sons</Label>
                <Switch 
                  id="soundEnabled" 
                  checked={preferences.soundEnabled} 
                  onCheckedChange={(checked) => saveUserPreference('soundEnabled', checked)}
                  disabled={loading || saving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="taskReminders">Lembretes de Tarefas</Label>
                <Switch 
                  id="taskReminders" 
                  checked={preferences.taskReminders} 
                  onCheckedChange={(checked) => saveUserPreference('taskReminders', checked)}
                  disabled={loading || saving}
                />
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Escolha como você gostaria de ser notificado.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
