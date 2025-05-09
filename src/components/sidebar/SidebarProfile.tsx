
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AvatarUpload } from "@/components/AvatarUpload";
import { Mountain } from 'lucide-react';
import { getOrCreateProfile } from '@/supabase/helper';
import { useSidebarProfile } from '@/hooks/use-sidebar-profile';
import { toast } from 'sonner';

interface SidebarProfileProps {
  user: User | null;
  loading: boolean;
}

export function SidebarProfile({ user, loading: authLoading }: SidebarProfileProps) {
  const { avatarUrl, username, loading: profileLoading, loadUserProfile } = useSidebarProfile(user);
  
  const handleAvatarUrlChange = async (url: string) => {
    console.log('Avatar URL alterada:', url);
    // O hook use-sidebar-profile já atualiza automaticamente via realtime
    // mas podemos forçar uma nova verificação
    if (user) {
      toast.info('Atualizando perfil...');
      await loadUserProfile();
      toast.success('Avatar atualizado com sucesso!');
    }
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
            user={user} // Add the required user prop
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
