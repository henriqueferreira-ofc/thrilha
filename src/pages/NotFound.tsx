import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Home, ArrowLeft, Settings, Calendar } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: Tentativa de acesso a rota inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="max-w-md w-full text-center p-8 rounded-lg border border-white/10">
        <h1 className="text-6xl font-bold mb-6 text-purple-400">404</h1>
        <p className="text-xl mb-8">
          Oops! A página que você está procurando não existe.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          Caminho: <code className="bg-gray-800 px-2 py-1 rounded">{location.pathname}</code>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2"
            onClick={goBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <Button 
            variant="default" 
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
            asChild
          >
            <Link to={user ? "/tasks" : "/"}>
              <Home className="w-4 h-4" />
              {user ? "Tarefas" : "Página Inicial"}
            </Link>
          </Button>
        </div>
        
        {user && (
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              variant="ghost" 
              className="text-sm"
              asChild
            >
              <Link to="/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Calendário
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              className="text-sm"
              asChild
            >
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
