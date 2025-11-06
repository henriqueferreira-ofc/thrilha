
import { useState, useRef } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import BirthdayList from '@/components/birthdays/BirthdayList';
import BirthdayForm from '@/components/birthdays/BirthdayForm';
import ZapierIntegration from '@/components/birthdays/ZapierIntegration';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
              <div className="flex items-center gap-2 sm:gap-3">
                <SidebarTrigger className="md:hidden h-8 w-8 sm:h-9 sm:w-9 text-white/90" aria-label="Abrir menu" />
                <h1 className="text-lg sm:text-xl font-bold purple-gradient-text truncate">Aniversários</h1>
              </div>
            </div>
            <div className="page-header-actions items-center">
              <Button
                size="sm"
                className="purple-gradient-bg h-10 px-4 text-sm font-semibold text-white shrink-0 flex items-center gap-2"
                onClick={() => setShowForm(!showForm)}
              >
                <Plus className="h-4 w-4" />
                <span>{showForm ? 'Cancelar' : 'Adicionar'}</span>
              </Button>
            </div>
          </header>
          
          <main className="page-main space-y-4 sm:space-y-6">
            <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="glass-panel p-4 sm:p-6 rounded-lg sm:rounded-xl">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Lista de Aniversários</h2>
                <BirthdayList ref={birthdayListRef} />
              </div>
              
              {showForm && (
                <div className="glass-panel p-4 sm:p-6 rounded-lg sm:rounded-xl">
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Adicionar Novo Aniversário</h2>
                  <BirthdayForm 
                    onClose={() => setShowForm(false)} 
                    onSuccess={refreshList}
                  />
                </div>
              )}
              
              <div className="glass-panel p-4 sm:p-6 rounded-lg sm:rounded-xl">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Configurar Lembretes no WhatsApp</h2>
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
