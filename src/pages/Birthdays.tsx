
import { useState, useRef } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import BirthdayList from '@/components/birthdays/BirthdayList';
import BirthdayForm from '@/components/birthdays/BirthdayForm';
import ZapierIntegration from '@/components/birthdays/ZapierIntegration';
import { Button } from '@/components/ui/button';

const Birthdays = () => {
  const [showForm, setShowForm] = useState(false);
  const birthdayListRef = useRef<any>(null);

  // Função para forçar a atualização da lista de aniversários
  const refreshList = () => {
    if (birthdayListRef.current && typeof birthdayListRef.current.fetchBirthdays === 'function') {
      birthdayListRef.current.fetchBirthdays();
    }
  };

  return (
    <SidebarProvider>
      <div className="page-wrapper mountain-pattern">
        <TaskSidebar hideDefaultTrigger />
        
        <div className="flex-1 flex flex-col">
          <header className="page-header backdrop-blur-sm bg-black/20">
            <div className="flex flex-col gap-2 text-white flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden h-9 w-9 text-white/90" aria-label="Abrir menu" />
                <h1 className="text-xl font-bold purple-gradient-text truncate">Aniversários</h1>
              </div>
            </div>
            <div className="page-header-actions items-center">
              <Button
                size="sm"
                className="purple-gradient-bg h-10 px-4 text-sm font-semibold shrink-0 flex items-center gap-2"
                onClick={() => setShowForm(!showForm)}
              >
                <span className="text-lg leading-none">+</span>
                {showForm ? 'Cancelar' : 'Adicionar Aniversário'}
              </Button>
            </div>
          </header>
          
          <main className="page-main space-y-6">
            <div className="w-full space-y-8">
              <div className="glass-panel p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4">Lista de Aniversários</h2>
                <BirthdayList ref={birthdayListRef} />
              </div>
              
              {showForm && (
                <div className="glass-panel p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-4">Adicionar Novo Aniversário</h2>
                  <BirthdayForm 
                    onClose={() => setShowForm(false)} 
                    onSuccess={refreshList}
                  />
                </div>
              )}
              
              <div className="glass-panel p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4">Configurar Lembretes no WhatsApp</h2>
                <ZapierIntegration />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Birthdays;
