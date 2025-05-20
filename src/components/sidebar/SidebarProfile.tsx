import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AvatarDisplay } from "@/components/avatar/AvatarDisplay";
import { Mountain } from 'lucide-react';
import { useSidebarProfile } from '@/hooks/use-sidebar-profile';

interface SidebarProfileProps {
  user: User | null;
  loading: boolean;
}

export function SidebarProfile({ user, loading: authLoading }: SidebarProfileProps) {
  const { avatarUrl, username, loading: profileLoading } = useSidebarProfile(user);
  
  // Registrar a URL do avatar atual para depuração
  useEffect(() => {
    console.log('SidebarProfile: Avatar URL atual:', avatarUrl);
  }, [avatarUrl]);

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <div className="flex items-center gap-2">
        <Mountain className="h-6 w-6 text-purple-300" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-purple-400 to-purple-300 bg-clip-text text-transparent">
          Thrilha
        </h1>
      </div>
      {user && (
        <div className="flex flex-col items-center gap-2 w-full mt-2">
          <AvatarDisplay
            avatarUrl={avatarUrl} 
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
