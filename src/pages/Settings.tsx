
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { SettingsProvider } from '@/context/SettingsContext';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

const Settings = () => {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <div className="page-wrapper">
          <TaskSidebar hideDefaultTrigger />
          
          <div className="flex-1 flex flex-col">
            <header className="page-header">
              <div className="flex items-center gap-3 text-white">
              <SidebarTrigger className="md:hidden h-9 w-9 text-white/90" aria-label="Abrir menu" />
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
