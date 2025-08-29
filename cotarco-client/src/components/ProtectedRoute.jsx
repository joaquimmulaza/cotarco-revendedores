import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config/config';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Se a sessão ainda está a ser validada, não renderiza nada (ou um spinner)
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Lógica de redirecionamento após a validação
  if (!isAuthenticated) {
    // Se o utilizador não está autenticado, manda-o para o login
    const from = adminOnly ? config.ROUTES.ADMIN_DASHBOARD : location.pathname;
    const loginPath = adminOnly ? config.ROUTES.ADMIN_LOGIN : config.ROUTES.LOGIN;
    return <Navigate to={loginPath} state={{ from }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Se a rota é só para admins e o utilizador não é admin, manda-o para o dashboard normal
    return <Navigate to={config.ROUTES.DASHBOARD} replace />;
  }

  if (!adminOnly && isAdmin) {
    // Se a rota é para revendedores e o utilizador é admin, manda-o para o dashboard de admin
    return <Navigate to={config.ROUTES.ADMIN_DASHBOARD} replace />;
  }
  
  // Se tudo estiver correto, renderiza a página pedida
  return children;
};

export default ProtectedRoute;