
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, CalendarClock } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export function AppearanceSettings() {
  const { preferences, saveUserPreference, loading, saving } = useSettings();

  return (
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
}
