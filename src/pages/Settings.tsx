
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { SettingsProvider } from '@/context/SettingsContext';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

const Settings = () => {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <div className="page-wrapper">
          <TaskSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="page-header">
              <div className="flex flex-col gap-2 w-full">
              <h1 className="text-xl font-bold">Configurações</h1>
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
