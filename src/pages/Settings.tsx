import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { UserPreferences } from '@/types/common';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '../components/ui/input';
import { Moon, Sun, Volume2, VolumeX, Bell, BellOff, Mail, MailX, CalendarClock, Calendar, Upload, User, Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CollaborationSettings } from '../components/CollaborationSettings';

// As preferências padrão do usuário
const defaultPreferences: UserPreferences = {
  darkMode: true,
  compactMode: false,
  soundEnabled: true,
  pushNotifications: false,
  emailNotifications: true,
  taskReminders: true
};

type Section = 'account' | 'appearance' | 'notifications' | 'collaboration';

interface ProfileChanges {
  id: string;
  avatar_url: string | null;
  updated_at: string;
  username: string;
  full_name: string | null;
  website: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('account');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [bucketsList, setBucketsList] = useState<string[]>([]);
  
  useEffect(() => {
    if (user && isInitialLoad) {
      loadUserPreferences();
      setIsInitialLoad(false);
    }
  }, [user, isInitialLoad]);
  
  // Adicionar listener para mudanças no perfil
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
        (payload: RealtimePostgresChangesPayload<ProfileChanges>) => {
          const newProfile = payload.new as ProfileChanges;
          if (newProfile && newProfile.avatar_url !== undefined) {
            const newUrl = newProfile.avatar_url + '?t=' + new Date().getTime();
            console.log('Avatar atualizado via realtime:', newUrl);
            setAvatarUrl(newUrl);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);
  
  const loadUserPreferences = async () => {
    if (!user) {
      console.log('Usuário não autenticado');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Iniciando carregamento das preferências para o usuário:', user.id);
      
      // Primeiro, carregar os dados do perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('preferences, username, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        // Se for erro de perfil não encontrado, criar um novo
        if (profileError.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando novo perfil');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              preferences: defaultPreferences,
              username: user.email?.split('@')[0] || '',
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
            throw new Error(`Erro ao criar perfil: ${insertError.message}`);
          }
          
          setPreferences(defaultPreferences);
          setUsername(user.email?.split('@')[0] || '');
          return;
        }
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      }
      
      if (!profileData) {
        console.log('Nenhum dado de perfil encontrado, criando perfil padrão');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            preferences: defaultPreferences,
            username: user.email?.split('@')[0] || '',
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
          throw new Error(`Erro ao criar perfil: ${insertError.message}`);
        }
        
        setPreferences(defaultPreferences);
        setUsername(user.email?.split('@')[0] || '');
        return;
      }
      
      console.log('Dados do perfil carregados:', profileData);
      
      // Parse das preferências com tratamento de erro
      let userPrefs = defaultPreferences;
      try {
        if (profileData.preferences) {
          userPrefs = typeof profileData.preferences === 'string' 
            ? JSON.parse(profileData.preferences)
            : profileData.preferences;
          console.log('Preferências parseadas:', userPrefs);
        }
      } catch (parseError) {
        console.error('Erro ao fazer parse das preferências:', parseError);
        userPrefs = defaultPreferences;
      }
      
      setPreferences({
        ...defaultPreferences,
        ...userPrefs
      });
      
      setUsername(profileData.username || '');

      // Se tiver avatar_url no perfil, usar ela
      if (profileData.avatar_url) {
        console.log('Avatar URL encontrada:', profileData.avatar_url);
        const avatarWithTimestamp = profileData.avatar_url + '?t=' + new Date().getTime();
        console.log('Avatar URL com timestamp:', avatarWithTimestamp);
        setAvatarUrl(avatarWithTimestamp);
      } else {
        // Se não tiver, tentar pegar do user metadata
        const metadataAvatar = user.user_metadata?.avatar_url;
        console.log('Avatar do metadata:', metadataAvatar);
        if (metadataAvatar) {
          const metadataAvatarWithTimestamp = metadataAvatar + '?t=' + new Date().getTime();
          setAvatarUrl(metadataAvatarWithTimestamp);
        } else {
          setAvatarUrl(null);
        }
      }
    } catch (error: unknown) {
      console.error('Erro detalhado ao carregar preferências:', error);
      toast.error('Não foi possível carregar suas preferências. Por favor, tente novamente.');
      // Não tentar recarregar automaticamente para evitar loops
    } finally {
      setLoading(false);
    }
  };
  
  const saveUserPreference = async (key: string, value: boolean) => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Atualizar estado local primeiro
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));
      
      const updatedPreferences = {
        ...preferences,
        [key]: value
      };
      
      // Tentar salvar no banco de dados
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: updatedPreferences
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Erro ao salvar preferência:', error);
        // Reverter estado local em caso de erro
        setPreferences(prev => ({
          ...prev,
          [key]: !value
        }));
        throw error;
      }
      
      toast.success('Preferência atualizada com sucesso');
    } catch (error: unknown) {
      console.error('Erro ao salvar preferência:', error);
      toast.error('Não foi possível salvar sua preferência');
    } finally {
      setSaving(false);
    }
  };
  
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      
      const file = event.target.files?.[0];
      if (!file || !user) return;

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }

      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      console.log('Iniciando upload de novo avatar');

      // Gerar nome de arquivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      console.log('Nome do arquivo para upload:', fileName);

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '0',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload concluído, obtendo URL pública');
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      console.log('URL pública obtida:', publicUrl);

      // Atualizar perfil com nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar perfil com novo avatar:', updateError);
        throw updateError;
      }

      // Atualizar estado local com timestamp para evitar cache
      setAvatarUrl(publicUrl + '?t=' + Date.now());
      
      toast.success('Avatar atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
      toast.error('Erro ao atualizar avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const testSupabaseConnection = async () => {
    try {
      setTestingConnection(true);
      
      console.log('Testando conexão com Supabase...');
      // Verificar buckets disponíveis
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Erro ao listar buckets:', error);
        toast.error('Erro ao conectar com Supabase Storage');
        return;
      }
      
      console.log('Buckets disponíveis:', buckets);
      setBucketsList(buckets.map(b => b.name));
      
      // Verificar se o bucket 'avatars' existe
      const avatarBucket = buckets.find(b => b.name === 'avatars');
      if (!avatarBucket) {
        console.error('Bucket de avatares não encontrado!');
        toast.error('Bucket de avatares não encontrado');
        return;
      }
      
      toast.success('Conexão com Supabase OK');
      
      // Listar arquivos no bucket de avatars
      const { data: files, error: filesError } = await supabase.storage
        .from('avatars')
        .list();
        
      if (filesError) {
        console.error('Erro ao listar arquivos:', filesError);
        return;
      }
      
      console.log('Arquivos no bucket avatars:', files);
      
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão com Supabase');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
  };

  const menuItems = [
    { id: 'account', label: 'Configurações da Conta' },
    { id: 'appearance', label: 'Aparência' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'collaboration', label: 'Colaboração' }
  ] as const;

  const AccountContent = () => {
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setUsername(newValue);
    };

    const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        saveUsername();
      }
    };

    return (
      <div>
        <h2 className="text-xl text-purple-400 mb-6">Configurações da Conta</h2>
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-purple-400 flex items-center justify-center">
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
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 p-1 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-colors"
              >
                <Upload className="w-4 h-4 text-white" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            {uploadingAvatar && <p className="text-sm text-gray-400">Enviando...</p>}
            
            <div className="w-full flex justify-center mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={testSupabaseConnection}
                disabled={testingConnection}
                className="text-xs"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar conexão'
                )}
              </Button>
            </div>
            
            {bucketsList.length > 0 && (
              <div className="w-full max-w-md bg-black/30 p-2 rounded text-xs">
                <p>Buckets disponíveis: {bucketsList.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <div>
              <Label htmlFor="username">Nome de Usuário</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  type="text" 
                  id="username" 
                  value={username} 
                  onChange={handleUsernameChange}
                  onKeyDown={handleUsernameKeyDown}
                  className="bg-black border-white/10"
                  placeholder="Digite seu nome de usuário"
                  disabled={saving}
                  autoComplete="off"
                />
                <Button 
                  onClick={saveUsername} 
                  disabled={saving} 
                  className="bg-purple-600 hover:bg-purple-700 px-3"
                >
                  {saving ? '...' : 'Salvar'}
                </Button>
              </div>
            </div>

            <div>
              <Label>E-mail</Label>
              <div className="mt-1">
                <Input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="bg-black/50 border-white/10 text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AppearanceContent = () => (
    <div>
      <h2 className="text-xl text-purple-400 mb-4">Aparência</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="darkMode" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Modo Escuro
          </Label>
          <Switch 
            id="darkMode" 
            checked={preferences.darkMode} 
            onCheckedChange={(checked) => saveUserPreference('darkMode', checked)}
            disabled={loading || saving}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="compactMode" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Modo Compacto
          </Label>
          <Switch 
            id="compactMode" 
            checked={preferences.compactMode} 
            onCheckedChange={(checked) => saveUserPreference('compactMode', checked)}
            disabled={loading || saving}
          />
        </div>
      </div>
    </div>
  );

  const NotificationsContent = () => (
    <div>
      <h2 className="text-xl text-purple-400 mb-4">Notificações</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="emailNotifications" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Notificações por Email
          </Label>
          <Switch 
            id="emailNotifications" 
            checked={preferences.emailNotifications} 
            onCheckedChange={(checked) => saveUserPreference('emailNotifications', checked)}
            disabled={loading || saving}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="pushNotifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações Push
          </Label>
          <Switch 
            id="pushNotifications" 
            checked={preferences.pushNotifications} 
            onCheckedChange={(checked) => saveUserPreference('pushNotifications', checked)}
            disabled={loading || saving}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="soundEnabled" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Sons
          </Label>
          <Switch 
            id="soundEnabled" 
            checked={preferences.soundEnabled} 
            onCheckedChange={(checked) => saveUserPreference('soundEnabled', checked)}
            disabled={loading || saving}
          />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return <AccountContent />;
      case 'appearance':
        return <AppearanceContent />;
      case 'notifications':
        return <NotificationsContent />;
      case 'collaboration':
        return <CollaborationSettings />;
      default:
        return <AccountContent />;
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
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="rounded-lg border border-white/10">
              <div className="border-b border-white/10">
                <nav className="flex">
                  {menuItems.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => handleSectionChange(id as Section)}
                      className={`px-6 py-3 text-sm font-medium transition-colors ${
                        activeSection === id
                          ? 'text-purple-400 border-b-2 border-purple-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-6">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
