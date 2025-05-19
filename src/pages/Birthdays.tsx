
import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import BirthdayList from '@/components/birthdays/BirthdayList';
import BirthdayForm from '@/components/birthdays/BirthdayForm';
import ZapierIntegration from '@/components/birthdays/ZapierIntegration';

const Birthdays = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold purple-gradient-text">Aniversários</h1>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 purple-gradient-bg rounded-md text-white"
            >
              {showForm ? 'Cancelar' : 'Adicionar Aniversário'}
            </button>
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="glass-panel p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4">Lista de Aniversários</h2>
                <BirthdayList />
              </div>
              
              {showForm && (
                <div className="glass-panel p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-4">Adicionar Novo Aniversário</h2>
                  <BirthdayForm onClose={() => setShowForm(false)} />
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
