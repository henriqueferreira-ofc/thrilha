import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';

const Settings = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold">Configurações</h1>
          </header>
          
          <main className="flex-1 p-6">
            <div className="bg-black p-6 rounded-lg border border-white/10">
              <h2 className="text-lg font-medium mb-4">Preferências do Usuário</h2>
              <p className="text-muted-foreground">
                Esta página permitirá configurar suas preferências pessoais do aplicativo.
              </p>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
