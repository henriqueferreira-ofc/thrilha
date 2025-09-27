
import { useState, useRef } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import BirthdayList from '@/components/birthdays/BirthdayList';
import BirthdayForm from '@/components/birthdays/BirthdayForm';
import ZapierIntegration from '@/components/birthdays/ZapierIntegration';

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
      <div className="page-wrapper">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="page-header">
            <div className="flex flex-col gap-2 w-full">
              <h1 className="text-xl font-bold purple-gradient-text">Aniversários</h1>
            </div>
            <div className="page-header-actions">
              <button 
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 purple-gradient-bg rounded-md text-white w-full sm:w-auto"
              >
                {showForm ? 'Cancelar' : 'Adicionar Aniversário'}
              </button>
            </div>
          </header>
          
          <main className="page-main">
            <div className="max-w-4xl mx-auto space-y-8">
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
