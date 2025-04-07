import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';

const About = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold">Sobre</h1>
          </header>
          
          <main className="flex-1 p-6">
            <div className="bg-black p-6 rounded-lg border border-white/10">
              <h2 className="text-lg font-medium mb-4 purple-gradient-text">Sobre o Trilha</h2>
              <div className="space-y-4">
                <p className="text-white/80">
                  O Trilha é um aplicativo de gerenciamento de tarefas desenvolvido para ajudar você a organizar suas atividades de forma eficiente e intuitiva.
                </p>
                <div className="space-y-2">
                  <h3 className="font-semibold text-purple-300">Principais características:</h3>
                  <ul className="list-disc list-inside text-white/80 space-y-1">
                    <li>Organização por status (A Fazer, Em Progresso, Concluídas)</li>
                    <li>Interface moderna e intuitiva</li>
                    <li>Calendário integrado</li>
                    <li>Totalmente gratuito</li>
                  </ul>
                </div>
                <p className="text-white/60 text-sm">
                  Versão 1.0.0
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default About; 