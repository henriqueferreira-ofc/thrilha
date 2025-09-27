import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';

export const About = () => {
  return (
    <SidebarProvider>
      <div className="page-wrapper">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="page-header">
            <div className="flex flex-col gap-2 w-full">
              <h1 className="text-xl font-bold">Sobre</h1>
            </div>
          </header>
          
          <main className="page-main">
            <div className="bg-black p-6 rounded-lg border border-white/10">
              <h2 className="text-lg font-medium mb-4 purple-gradient-text">Sobre o Thrilha</h2>
              <div className="space-y-4">
                <p className="text-white/80">
                  O Thrilha é um aplicativo de gerenciamento de tarefas desenvolvido para ajudar você a organizar suas atividades de forma eficiente e intuitiva.
                </p>
                <div className="space-y-2">
                  <h3 className="font-semibold text-purple-300">Principais características:</h3>
                  <ul className="list-disc list-inside text-white/80 space-y-1">
                    <li>Organização por status (A Fazer, Em Progresso, Concluídas)</li>
                    <li>Interface moderna e intuitiva</li>
                    <li>Calendário integrado</li>
                    <li>Gerenciamento de tarefas por data</li>
                    <li>Organizaçõa de datas de aniversários</li>
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
