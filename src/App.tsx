
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
  useLocation 
} from "react-router-dom";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import About from "./pages/About";
import Auth from "./pages/Auth";
import SubscriptionPage from "./pages/Subscription";
import Birthdays from "./pages/Birthdays";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from './supabase/client';
import { clearAuthData } from "./utils/auth";

// Componente para lidar com navegação e erros
const NavigationHandler = ({ children }: { children: React.ReactNode }) => {
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
const ProtectedRoute = ({ element }: { element: React.ReactElement }) => {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    // Verificar autenticação quando o componente montar
    const verifyAuth = async () => {
      console.log('ProtectedRoute - Verificando autenticação:', { 
        userPresent: !!user,
        sessionPresent: !!session,
        loading,
        path: location.pathname
      });
      
      // Se não estiver mais carregando, podemos verificar
      if (!loading) {
        if (!user || !session) {
          console.log('Usuário não autenticado, redirecionando para /auth');
          navigate('/auth', { replace: true });
        } else {
          console.log('Usuário autenticado:', user.email);
        }
        setChecking(false);
      }
    };
    
    verifyAuth();
  }, [user, session, loading, navigate, location.pathname]);
  
  // Exibir carregamento enquanto verifica usuário
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-xl text-purple-400 flex flex-col items-center">
          <span>Verificando autenticação...</span>
          <div className="mt-4 w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Se o usuário não estiver autenticado, não renderizar nada enquanto redireciona
  if (!user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-xl text-purple-400 flex flex-col items-center">
          <span>Redirecionando para login...</span>
          <div className="mt-4 w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Se o usuário está autenticado, renderiza o elemento
  return element;
};

// Criar uma instância do QueryClient fora do componente
const queryClient = new QueryClient();

// Determinar o basename baseado no ambiente
const getBasename = () => {
  // Em desenvolvimento local, não usar basename
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return undefined;
  }
  // Em produção no GitHub Pages, usar o basename
  if (window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/thrilha')) {
    return "/thrilha";
  }
  // Para outros ambientes de produção, não usar basename
  return undefined;
};

// Componente App
const App = () => {
  const basename = getBasename();
  
  console.log('App iniciando com basename:', basename);
  console.log('Current location:', window.location.href);
  console.log('Hostname:', window.location.hostname);
  
  return (
    <BrowserRouter basename={basename}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConnectionManager />
          <Toaster />
          <Sonner />
          <NavigationHandler>
            <AuthProvider>
              <Routes>
                {/* Landing page agora é a rota principal diretamente */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Rotas protegidas com verificação de autenticação */}
                <Route path="/app" element={<Navigate to="/tasks" replace />} />
                <Route path="/tasks" element={<ProtectedRoute element={<Index />} />} />
                <Route path="/calendar" element={<ProtectedRoute element={<Calendar />} />} />
                <Route path="/birthdays" element={<ProtectedRoute element={<Birthdays />} />} />
                <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
                <Route path="/about" element={<ProtectedRoute element={<About />} />} />
                <Route path="/subscription" element={<ProtectedRoute element={<SubscriptionPage />} />} />

                {/* Rota para qualquer outra URL */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </AuthProvider>
          </NavigationHandler>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
