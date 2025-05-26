
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavigationHandlerProps {
  children: React.ReactNode;
}

export const NavigationHandler = ({ children }: NavigationHandlerProps) => {
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
