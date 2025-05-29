
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Calendar, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const LandingPage = () => {
  const { user } = useAuth();

  useEffect(() => {
    console.log('LandingPage carregada');
    console.log('Usuário:', user ? 'logado' : 'não logado');
  }, [user]);

  // Se o usuário estiver logado, redirecionar para as tarefas
  if (user) {
    console.log('Usuário logado, redirecionando para /tasks');
    return <Link to="/tasks" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
            <span className="text-2xl font-bold text-white">Thrilha</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" asChild className="text-white hover:text-purple-300">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to="/auth">Começar Agora</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Organize suas tarefas com{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
            Thrilha
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          A plataforma completa para gerenciar projetos, organizar tarefas e colaborar com sua equipe de forma eficiente.
        </p>
        <div className="space-x-4">
          <Button size="lg" asChild className="bg-purple-600 hover:bg-purple-700">
            <Link to="/auth">Comece Gratuitamente</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-black">
            Ver Demonstração
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          Recursos Poderosos para Sua Produtividade
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: CheckCircle,
              title: "Gestão de Tarefas",
              description: "Organize e priorize suas tarefas com facilidade"
            },
            {
              icon: Users,
              title: "Colaboração",
              description: "Trabalhe em equipe de forma sincronizada"
            },
            {
              icon: Calendar,
              title: "Calendário",
              description: "Visualize prazos e organize sua agenda"
            },
            {
              icon: BarChart3,
              title: "Relatórios",
              description: "Acompanhe o progresso com relatórios detalhados"
            }
          ].map((feature, index) => (
            <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-purple-400 mb-2" />
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para aumentar sua produtividade?
          </h2>
          <p className="text-gray-300 mb-8">
            Junte-se a milhares de usuários que já organizaram suas vidas com o Thrilha.
          </p>
          <Button size="lg" asChild className="bg-purple-600 hover:bg-purple-700">
            <Link to="/auth">Criar Conta Gratuita</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/20">
        <div className="text-center text-gray-400">
          <p>&copy; 2024 Thrilha. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
