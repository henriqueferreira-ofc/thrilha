// Este componente está sendo substituído pelo ProtectedRoute no App.tsx
// Mantido apenas como referência

import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Adicionar este effect para lidar com a mudança de estado do usuário
  useEffect(() => {
    if (!loading && !user) {
      // Se o usuário não está carregando e não está autenticado
      // redirecionar para a página inicial em vez da página de autenticação
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Enquanto verifica a autenticação, não redireciona
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl text-purple-400">Carregando...</div>
      </div>
    );
  }

  // Se não houver usuário autenticado, redireciona para a página inicial
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Se houver usuário autenticado, renderiza a rota protegida
  return <Outlet />;
}
