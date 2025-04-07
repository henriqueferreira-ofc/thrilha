
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Enquanto verifica a autenticação, não redireciona
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl text-purple-400">Carregando...</div>
      </div>
    );
  }

  // Se não houver usuário autenticado, redireciona para a página de login
  if (!user) {
    // Redireciona para a página de login, mantendo a URL atual como state para retornar após o login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Se houver usuário autenticado, renderiza a rota protegida
  return <Outlet />;
}
