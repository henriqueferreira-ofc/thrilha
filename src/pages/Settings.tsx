
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPreferences } from '@/types/common';
import { Settings as SettingsIcon, Save, Moon, Sun, Volume2, Bell, Mail, Check } from 'lucide-react';
import { toast } from 'sonner';

// Default preferences if none are set
const defaultPreferences: UserPreferences = {
  darkMode: true,
  compactMode: false,
  emailNotifications: true,
  pushNotifications: false,
  soundEnabled: true,
  taskReminders: true
};

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [successMessage, setSuccessMessage] = useState('');

  // Load user preferences
  useEffect(() => {
    if (!user) return;
    
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        // Check if preferences exist and parse them
        if (data && data.preferences) {
          // Type assertion to UserPreferences
          const userPrefs = data.preferences as unknown as UserPreferences;
          setPreferences({
            ...defaultPreferences, 
            ...userPrefs
          });
        }
      } catch (error: unknown) {
        console.error('Error fetching preferences:', error);
        toast.error('Falha ao carregar preferências');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, [user]);

  // Handle preference toggle
  const handleTogglePreference = (key: keyof UserPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save preferences to database
  const handleSavePreferences = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: preferences as unknown as Record<string, unknown>
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setSuccessMessage('Preferências salvas com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
      toast.success('Preferências salvas com sucesso!');
    } catch (error: unknown) {
      console.error('Error saving preferences:', error);
      toast.error('Falha ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <Button variant="outline" onClick={handleSavePreferences} disabled={saving || loading}>
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </div>
      
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-200 rounded-md p-4 flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5 text-purple-400" />
              Conta
            </CardTitle>
            <CardDescription>Gerencie suas preferências da conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt="Avatar" />
                  <AvatarFallback className="bg-purple-500/20">
                    {user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Moon className="h-4 w-4 text-purple-400" />
                  <Label htmlFor="darkMode">Modo Escuro</Label>
                </div>
                <Switch 
                  id="darkMode"
                  checked={preferences.darkMode}
                  onCheckedChange={() => handleTogglePreference('darkMode')}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-purple-400" />
                  <Label htmlFor="compactMode">Modo Compacto</Label>
                </div>
                <Switch 
                  id="compactMode"
                  checked={preferences.compactMode}
                  onCheckedChange={() => handleTogglePreference('compactMode')}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5 text-purple-400" />
              Notificações
            </CardTitle>
            <CardDescription>Configure como você deseja ser notificado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-purple-400" />
                <Label htmlFor="emailNotifications">Notificações por Email</Label>
              </div>
              <Switch 
                id="emailNotifications"
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleTogglePreference('emailNotifications')}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-purple-400" />
                <Label htmlFor="pushNotifications">Notificações Push</Label>
              </div>
              <Switch 
                id="pushNotifications"
                checked={preferences.pushNotifications}
                onCheckedChange={() => handleTogglePreference('pushNotifications')}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-purple-400" />
                <Label htmlFor="soundEnabled">Sons</Label>
              </div>
              <Switch 
                id="soundEnabled"
                checked={preferences.soundEnabled}
                onCheckedChange={() => handleTogglePreference('soundEnabled')}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-purple-400" />
                <Label htmlFor="taskReminders">Lembretes de Tarefas</Label>
              </div>
              <Switch 
                id="taskReminders"
                checked={preferences.taskReminders}
                onCheckedChange={() => handleTogglePreference('taskReminders')}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">As notificações podem ser alteradas a qualquer momento.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
