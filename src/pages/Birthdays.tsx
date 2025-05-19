
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BirthdayList from '@/components/birthdays/BirthdayList';
import BirthdayForm from '@/components/birthdays/BirthdayForm';
import ZapierIntegration from '@/components/birthdays/ZapierIntegration';

const Birthdays = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navigation */}
      <nav className="py-5 px-6 md:px-12 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-purple-300" />
          <span className="text-xl font-bold purple-gradient-text">Thrilha</span>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="border-purple-300 text-purple-300 hover:bg-purple-300/10"
            onClick={() => navigate('/tasks')}
          >
            Tarefas
          </Button>
          <Button 
            variant="outline" 
            className="border-purple-300 text-purple-300 hover:bg-purple-300/10"
            onClick={() => navigate('/auth')}
          >
            Login
          </Button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 px-6 md:px-12 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold purple-gradient-text">Aniversários</h1>
            <Button 
              onClick={() => setShowForm(true)}
              className="purple-gradient-bg text-white"
            >
              Adicionar Aniversário
            </Button>
          </div>
          
          <div className="space-y-8">
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
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Mountain className="h-5 w-5 text-purple-300" />
            <span className="text-lg font-semibold purple-gradient-text">Thrilha</span>
          </div>
          <p className="text-sm text-white/60">© 2025 Thrilha. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Birthdays;
