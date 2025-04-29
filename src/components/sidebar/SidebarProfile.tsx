
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AvatarUpload } from "@/components/AvatarUpload";
import { Mountain } from 'lucide-react';
import { getOrCreateProfile } from '@/supabase/helper';

interface SidebarProfileProps {
  user: User | null;
  loading: boolean;
}

export function SidebarProfile({ user, loading }: SidebarProfileProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);
  
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { profile, error } = await getOrCreateProfile(user.id);
      
      if (profile) {
        if (profile.username) {
          setUsername(profile.username);
        } else {
          const defaultName = user.email 
            ? user.email.split('@')[0] 
            : `user_${user.id.substring(0, 8)}`;
          setUsername(defaultName);
        }
        
        if (profile.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        } else {
          setAvatarUrl(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar/criar perfil:', error);
      if (user?.email) {
        setUsername(user.email.split('@')[0]);
      } else if (user?.id) {
        setUsername(`user_${user.id.substring(0, 8)}`);
      } else {
        setUsername('Usuário');
      }
      setAvatarUrl(null);
    }
  };

  const handleAvatarUrlChange = (url: string) => {
    setAvatarUrl(url);
  };

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <div className="flex items-center gap-2">
        <Mountain className="h-6 w-6 text-purple-300" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-purple-400 to-purple-300 bg-clip-text text-transparent">
          Trilha
        </h1>
      </div>
      {user && (
        <div className="flex flex-col items-center gap-2 w-full mt-2">
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            onAvatarChange={handleAvatarUrlChange}
            size="sm"
          />
          {!loading && username && (
            <p className="text-sm font-medium text-purple-300">
              {username}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
