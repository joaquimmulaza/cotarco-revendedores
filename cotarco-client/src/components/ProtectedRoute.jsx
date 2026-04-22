import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config/config';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const loginPath = isAdminRoute ? config.ROUTES.ADMIN_LOGIN : config.ROUTES.LOGIN;
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  const userRole = user?.role;
  const isAuthorized = allowedRoles ? allowedRoles.includes(userRole) : true;

  if (!isAuthorized) {
    // If user is admin trying to access partner route, redirect to admin dashboard
    if (isAdmin) {
      return <Navigate to={config.ROUTES.ADMIN_DASHBOARD} replace />;
    }
    // If partner trying to access admin route, redirect to partner dashboard
    return <Navigate to={config.ROUTES.DASHBOARD} replace />;
  }
  
  return children;
};

export default ProtectedRoute;