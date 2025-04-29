
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { SettingsProvider } from '@/context/SettingsContext';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

const Settings = () => {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <TaskSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="p-6 flex justify-between items-center border-b border-white/10">
              <h1 className="text-xl font-bold">Configurações</h1>
            </header>
            
            <main className="flex-1 p-6 overflow-auto">
              <SettingsTabs />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SettingsProvider>
  );
};

export default Settings;
