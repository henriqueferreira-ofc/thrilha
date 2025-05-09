
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { AvatarUpload } from "@/components/AvatarUpload";
import { useSettings } from '@/context/SettingsContext';

export function AccountSettings() {
  const { 
    username, 
    setUsername, 
    saveUsername, 
    saving, 
    avatarUrl, 
    handleAvatarUrlChange, 
    testSupabaseConnection, 
    testingConnection, 
    bucketsList,
    user // This should now be recognized correctly
  } = useSettings();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
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
          <AvatarUpload 
            user={user} // Add the required user prop
            currentAvatarUrl={avatarUrl} 
            onAvatarChange={handleAvatarUrlChange} 
            size="lg" 
          />
          
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
}
