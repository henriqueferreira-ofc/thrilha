import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { withBasePath } from '@/lib/assetPath';
import { Mountain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  // Intersection Observer para revelar elementos ao rolar a página
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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

  const heroImage = withBasePath('trilha1.png');
  const heroFallback = withBasePath('placeholder.svg');

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden select-none">
      
      {/* Subtle Orbiting Mesh Gradients for background life */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-orbit-slow" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-orbit-medium" />

      {/* Navigation */}
      <nav className="py-5 px-4 sm:px-6 md:px-12 flex items-center justify-between border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-black/50 transition-all duration-300">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={goToLoginPage} 
          role="button" 
          tabIndex={0}
        >
          <Mountain className="h-6 w-6 text-purple-300 group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-xl font-bold purple-gradient-text tracking-wide transition-all group-hover:brightness-110">Thrilha</span>
        </div>
        <Button 
          variant="outline" 
          className="border-purple-300 text-purple-300 hover:bg-purple-300/10 hover:text-purple-200 transition-all duration-300 hover:scale-105 active:scale-95" 
          onClick={goToLoginPage}
        >
          Login
        </Button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 px-4 sm:px-6 md:px-12 py-12 sm:py-16 max-w-7xl mx-auto items-center">
        <div className="flex flex-col justify-center space-y-6 text-left reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold purple-gradient-text leading-tight break-words tracking-tight">
            Organize suas<br />
            <span className="md:whitespace-nowrap md:text-[0.95em]">tarefas com o Thrilha</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed font-light">
            Gerencie seus projetos e tarefas diárias com uma interface moderna e intuitiva. 
            Aumente sua produtividade com o Thrilha.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button 
              className="purple-gradient-bg text-white px-8 py-6 text-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] font-semibold" 
              onClick={goToLoginPage}
            >
              Teste Grátis
            </Button>
            <Button 
              variant="outline" 
              onClick={scrollToFeatures} 
              className="text-white border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 px-8 py-6 text-lg font-normal hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Saiba Mais
            </Button>
          </div>
        </div>

        <div className="flex justify-center md:justify-end items-center reveal-on-scroll animate-float" style={{ transitionDelay: '250ms' }}>
          <div className="relative w-full max-w-2xl md:max-w-3xl mt-8 md:mt-16 transform translate-y-2 md:translate-y-4">
            <div className="absolute -left-12 top-6 h-32 w-32 rounded-full bg-purple-500/15 blur-3xl -z-10" />
            <img 
              src={heroImage} 
              alt="Prévia do aplicativo Thrilha" 
              className="relative z-10 w-full max-h-[520px] object-contain drop-shadow-[0_35px_45px_rgba(20,0,40,0.55)] hover:scale-[1.01] transition-transform duration-500" 
              onError={e => {
                e.currentTarget.src = heroFallback;
              }} 
            />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section
        id="features"
        className="-mt-10 md:-mt-12 pt-12 md:pt-16 pb-20 px-4 sm:px-6 md:px-12 bg-black/40 border-t border-white/10 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center purple-gradient-text mb-12 tracking-tight reveal-on-scroll">
            Por que escolher o Thrilha?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-purple-500/30 hover:bg-black/60 transition-all duration-500 group cursor-default card-glow reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-purple-200 transition-colors duration-300">Interface Intuitiva</h3>
              <p className="text-white/70 leading-relaxed text-sm">Design moderno e fácil de usar para gerenciar suas tarefas de forma eficiente.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-purple-500/30 hover:bg-black/60 transition-all duration-500 group cursor-default card-glow reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-purple-200 transition-colors duration-300">Organize por Status</h3>
              <p className="text-white/70 leading-relaxed text-sm">Visualize suas tarefas por status: a fazer, em progresso e concluídas.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-purple-500/30 hover:bg-black/60 transition-all duration-500 group cursor-default card-glow reveal-on-scroll" style={{ transitionDelay: '300ms' }}>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-purple-200 transition-colors duration-300">Lembretes de Aniversários</h3>
              <p className="text-white/70 leading-relaxed text-sm">Nunca mais esqueça um aniversário com nossos lembretes no WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 md:px-12 border-t border-white/10 bg-black/60 backdrop-blur-sm reveal-on-scroll">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
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
