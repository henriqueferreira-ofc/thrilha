
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  BrowserRouter,
  Routes, 
  Route, 
  Navigate
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
import { AuthProvider } from "./context/AuthContext";
import { NavigationHandler } from "./components/routing/NavigationHandler";
import { ConnectionManager } from "./components/routing/ConnectionManager";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";

// Criar uma instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

const App = () => {
  console.log('App iniciando...');
  console.log('Current location:', window.location.href);
  console.log('Hostname:', window.location.hostname);
  console.log('Environment:', import.meta.env.MODE);
  
  // Adicionar fallback para problemas de renderização
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <ConnectionManager />
            <Toaster />
            <Sonner />
            <NavigationHandler>
              <AuthProvider>
                <div className="min-h-screen bg-black text-white">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auth" element={<Auth />} />
                    
                    <Route path="/app" element={<Navigate to="/tasks" replace />} />
                    <Route path="/tasks" element={<ProtectedRoute element={<Index />} />} />
                    <Route path="/calendar" element={<ProtectedRoute element={<Calendar />} />} />
                    <Route path="/birthdays" element={<ProtectedRoute element={<Birthdays />} />} />
                    <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
                    <Route path="/about" element={<ProtectedRoute element={<About />} />} />
                    <Route path="/subscription" element={<ProtectedRoute element={<SubscriptionPage />} />} />

                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </div>
              </AuthProvider>
            </NavigationHandler>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('Erro ao renderizar App:', error);
    return (
      <div className="min-h-screen bg-red-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erro na aplicação</h1>
          <p>Verifique o console para mais detalhes</p>
        </div>
      </div>
    );
  }
};

export default App;
