
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';

const Calendar = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold">Calendário</h1>
          </header>
          
          <main className="flex-1 p-6">
            <div className="glass-panel p-6 rounded-lg">
              <h2 className="text-lg font-medium mb-4">Visualização do Calendário</h2>
              <p className="text-muted-foreground">
                Esta página exibirá o calendário com suas tarefas organizadas por data.
              </p>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Calendar;
