
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  element: React.ReactElement;
}

export const ProtectedRoute = ({ element }: ProtectedRouteProps) => {
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
