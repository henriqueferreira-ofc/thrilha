
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useLocation,
  HashRouter 
} from "react-router-dom";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import About from "./pages/About";
import Auth from "./pages/Auth";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from './supabase/client';

// Componente para lidar com navegação e erros
const NavigationHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Detectar erros de navegação e registrá-los
  useEffect(() => {
    const handleError = (event: PromiseRejectionEvent) => {
      console.error("Erro de navegação:", event);
      
      // Se for um erro 404, redirecionar para a página inicial
      if (event.reason && event.reason.toString().includes("404")) {
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("unhandledrejection", handleError);
    
    return () => {
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, [navigate]);

  useEffect(() => {
    console.log("Navegação para:", location.pathname);
  }, [location]);

  return <>{children}</>;
};

// Componente para lidar com conexão e desconexão limpa
function ConnectionManager() {
  useEffect(() => {
    // Quando o componente é montado, verificamos se há canais existentes para limpar
    const cleanup = () => {
      try {
        // Fechar todas as conexões do Supabase
        supabase.realtime.disconnect();
        console.log('Todas as conexões Supabase foram encerradas');
      } catch (err) {
        console.error('Erro ao limpar conexões:', err);
      }
    };

    // Adicionar event listeners para casos de fechamento de página
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);

    // Limpeza ao desmontar o componente
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
      cleanup();
    };
  }, []);

  return null; // Este componente não renderiza nada
}

// Componente para verificar autenticação e redirecionar para rotas protegidas
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Quando o componente montar ou atualizar, verificar autenticação
    const checkAuth = async () => {
      console.log('ProtectedRoute - Verificando autenticação:', { 
        user: user ? 'usuário presente' : 'usuário ausente',
        loading,
        path: location.pathname
      });
      
      if (!loading) {
        setAuthChecked(true);
        if (!user) {
          console.log('Usuário não autenticado, redirecionando para /auth');
          navigate('/auth', { replace: true });
        } else {
          console.log('Usuário autenticado:', user.email);
        }
      }
    };
    
    checkAuth();
  }, [user, loading, navigate, location.pathname]);
  
  // Exibir carregamento enquanto verifica usuário
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl text-purple-400">Verificando autenticação...</div>
      </div>
    );
  }
  
  // Se o usuário não estiver autenticado, não renderizar nada enquanto redireciona
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-purple-400">Redirecionando para login...</div>
      </div>
    );
  }
  
  // Se o usuário está autenticado, renderiza o elemento
  return element;
};

// Determinar qual Router usar, dependendo do ambiente
// HashRouter é mais seguro para ambientes que não configuram corretamente o roteamento de SPA
const Router = import.meta.env.DEV ? HashRouter : BrowserRouter;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <AuthProvider>
        <TooltipProvider>
          <ConnectionManager />
          <Toaster />
          <Sonner />
          <NavigationHandler>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Rotas protegidas com verificação de autenticação */}
              <Route path="/tasks" element={<ProtectedRoute element={<Index />} />} />
              <Route path="/calendar" element={<ProtectedRoute element={<Calendar />} />} />
              <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
              <Route path="/about" element={<ProtectedRoute element={<About />} />} />

              {/* Rota para qualquer outra URL */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </NavigationHandler>
        </TooltipProvider>
      </AuthProvider>
    </Router>
  </QueryClientProvider>
);

export default App;
