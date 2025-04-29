
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail, Bell, Volume2 } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export function NotificationSettings() {
  const { preferences, saveUserPreference, loading, saving } = useSettings();

  return (
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
}
