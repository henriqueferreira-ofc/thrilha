
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { validateSession, checkSecurityViolations } from "@/utils/auth"; // Importação atualizada
import { toast } from "@/hooks/use-toast";

export function RequireAuth() {
  const { user, loading, forceLogout } = useAuth();
  const location = useLocation();
  const [securityChecked, setSecurityChecked] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Verificação de segurança na montagem do componente
  useEffect(() => {
    const performSecurityChecks = async () => {
      try {
        // Verificar violações de segurança (clickjacking, etc)
        const securityOk = checkSecurityViolations();
        if (!securityOk) {
          console.error('Violação de segurança detectada');
          forceLogout();
          setIsValid(false);
          return;
        }
        
        // Se temos um usuário, verificar validade da sessão
        if (user && !loading) {
          console.log('Validando sessão para usuário autenticado');
          const sessionValid = await validateSession();
          
          if (!sessionValid) {
            console.error('Sessão inválida detectada, forçando logout');
            toast.error('Sua sessão expirou. Por favor, faça login novamente.');
            forceLogout();
            setIsValid(false);
            return;
          }
          
          console.log('Sessão validada com sucesso');
        }
        
        setIsValid(true);
      } catch (error) {
        console.error('Erro nas verificações de segurança:', error);
        toast.error('Ocorreu um erro de segurança. Por favor, faça login novamente.');
        forceLogout();
        setIsValid(false);
      } finally {
        setSecurityChecked(true);
      }
    };
    
    performSecurityChecks();
    
    // Verificar periodicamente a validade da sessão (a cada 5 minutos)
    const securityInterval = setInterval(performSecurityChecks, 5 * 60 * 1000);
    
    return () => {
      clearInterval(securityInterval);
    };
  }, [user, loading, forceLogout]);

  // Enquanto verifica a autenticação ou segurança, não redireciona
  if (loading || !securityChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl text-purple-400">Carregando...</div>
      </div>
    );
  }

  // Se não houver usuário autenticado ou sessão inválida, redireciona para a página de autenticação
  if (!user || !isValid) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Se houver usuário autenticado e sessão válida, renderiza a rota protegida
  return <Outlet />;
}
