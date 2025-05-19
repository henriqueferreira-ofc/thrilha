
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mountain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  // Função para ir para a página de login
  const goToLoginPage = () => {
    navigate('/auth');
  };

  // Função para rolar suavemente até a seção de features
  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  // Função para ir para o dashboard de tarefas
  const goToTasks = () => {
    navigate('/tasks');
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navigation */}
      <nav className="py-5 px-6 md:px-12 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-purple-300" />
          <span className="text-xl font-bold purple-gradient-text">Thrilha</span>
        </div>
        <Button 
          variant="outline" 
          className="border-purple-300 text-purple-300 hover:bg-purple-300/10" 
          onClick={goToLoginPage}
        >
          Login
        </Button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <div className="flex flex-col justify-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold purple-gradient-text">
            Organize suas tarefas com o Thrilha
          </h1>
          <p className="text-lg text-white/80">
            Gerencie seus projetos e tarefas diárias com uma interface moderna e intuitiva. 
            Aumente sua produtividade com o Thrilha.
          </p>
          <div className="flex gap-4 pt-4">
            <Button 
              className="purple-gradient-bg text-white px-8 py-6 text-lg" 
              onClick={goToLoginPage}
            >
              Teste Grátis
            </Button>
            <Button 
              variant="outline" 
              onClick={scrollToFeatures} 
              className="text-white border-white/20 bg-white/5 px-8 py-6 text-lg font-normal"
            >
              Saiba Mais
            </Button>
          </div>
        </div>

        <div className="flex justify-center items-end">
          <div className="relative">
            <img 
              src="/trilha1.png" 
              alt="Trilha App" 
              className="relative z-10 max-h-[500px] object-contain -mb-16" 
              onError={e => {
                e.currentTarget.src = "https://placehold.co/300x600/3a1c71/ffffff?text=Trilha+App";
              }} 
            />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-16 px-6 md:px-12 bg-black/40 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center purple-gradient-text mb-12">
            Por que escolher o Thrilha?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3">Interface Intuitiva</h3>
              <p className="text-white/70">Design moderno e fácil de usar para gerenciar suas tarefas de forma eficiente.</p>
            </div>
            
            <div className="glass-panel p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3">Organize por Status</h3>
              <p className="text-white/70">Visualize suas tarefas por status: a fazer, em progresso e concluídas.</p>
            </div>
            
            <div className="glass-panel p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-3">Sincronização em Nuvem</h3>
              <p className="text-white/70">Acesse suas tarefas de qualquer dispositivo com sincronização em tempo real.</p>
            </div>
          </div>
        </div>
      </section>

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

export default LandingPage;
