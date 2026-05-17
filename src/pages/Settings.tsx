
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { SettingsProvider } from '@/context/SettingsContext';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

const Settings = () => {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <div className="page-wrapper mountain-pattern">
          <TaskSidebar hideDefaultTrigger />
          
          <div className="flex-1 flex flex-col min-w-0">
            <header className="page-header backdrop-blur-sm bg-black/20">
              <div className="flex items-center gap-3 text-white min-w-0 flex-1">
                <SidebarTrigger className="md:hidden h-10 w-10 text-white/90 [&>svg]:h-6 [&>svg]:w-6" aria-label="Abrir menu" />
                <h1 className="text-xl font-bold purple-gradient-text truncate">Configurações</h1>
              </div>
            </header>
            
            <main className="page-main">
              <SettingsTabs />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SettingsProvider>
  );
};

export default Settings;
