import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';

export const About = () => {
  return (
    <SidebarProvider>
      <div className="page-wrapper mountain-pattern">
        <TaskSidebar hideDefaultTrigger />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="page-header backdrop-blur-sm bg-black/20">
            <div className="flex items-center gap-3 text-white min-w-0 flex-1">
              <SidebarTrigger className="md:hidden h-10 w-10 text-white/90 [&>svg]:h-6 [&>svg]:w-6" aria-label="Abrir menu" />
              <h1 className="text-xl font-bold purple-gradient-text truncate">Sobre</h1>
            </div>
          </header>
          
          <main className="page-main">
            <div className="bg-black/60 p-4 sm:p-6 rounded-lg border border-white/10">
              <h2 className="text-lg font-medium mb-4 purple-gradient-text">Sobre o Thrilha</h2>
              <div className="space-y-4">
                <p className="text-white/80 text-sm sm:text-base">
                  O Thrilha é um aplicativo de gerenciamento de tarefas desenvolvido para ajudar você a organizar suas atividades de forma eficiente e intuitiva.
                </p>
                <div className="space-y-2">
                  <h3 className="font-semibold text-purple-300">Principais características:</h3>
                  <ul className="list-disc list-inside text-white/80 space-y-1 text-sm sm:text-base">
                    <li>Organização por status (A Fazer, Em Progresso, Concluídas)</li>
                    <li>Interface moderna e intuitiva</li>
                    <li>Calendário integrado</li>
                    <li>Gerenciamento de tarefas por data</li>
                    <li>Organização de datas de aniversários</li>
                    <li>Totalmente gratuito até 3 tarefas</li>
                  </ul>
                </div>
                <p className="text-white/60 text-sm">
                  Versão 1.1.0
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
