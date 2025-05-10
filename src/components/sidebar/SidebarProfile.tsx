
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AvatarDisplay } from "@/components/avatar/AvatarDisplay";
import { Mountain } from 'lucide-react';
import { getOrCreateProfile } from '@/supabase/helper';
import { useSidebarProfile } from '@/hooks/use-sidebar-profile';
import { toast } from 'sonner';
import { AvatarUpload } from '@/components/AvatarUpload';

interface SidebarProfileProps {
  user: User | null;
  loading: boolean;
}

export function SidebarProfile({ user, loading: authLoading }: SidebarProfileProps) {
  const { avatarUrl, username, loading: profileLoading, loadUserProfile, refreshProfile } = useSidebarProfile(user);
  
  const handleAvatarUrlChange = async (url: string) => {
    console.log('Avatar URL alterada:', url);
    // O hook use-sidebar-profile já atualiza automaticamente via realtime
    // mas podemos forçar uma nova verificação
    if (user) {
      toast.info('Atualizando perfil...');
      await loadUserProfile();
      // Forçar a recarga dos dados do perfil
      setTimeout(() => {
        refreshProfile();
        toast.success('Avatar atualizado com sucesso!');
      }, 1000);
    }
  };

  // Registrar a URL do avatar atual para depuração
  useEffect(() => {
    console.log('SidebarProfile: Avatar URL atual:', avatarUrl);
  }, [avatarUrl]);

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
            user={user}
            currentAvatarUrl={avatarUrl} 
            onAvatarChange={handleAvatarUrlChange}
            size="sm"
          />
          {!profileLoading && username && (
            <p className="text-sm font-medium text-purple-300">
              {username}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
