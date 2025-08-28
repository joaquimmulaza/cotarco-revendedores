import { createContext, useContext, useState, useEffect } from 'react';
import { config } from '../config/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar se o utilizador está autenticado ao carregar a app
  useEffect(() => {
    const token = localStorage.getItem(config.AUTH.TOKEN_KEY);
    const userData = localStorage.getItem(config.AUTH.USER_KEY);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        if (parsedUser.role === 'admin') {
          setIsAdminAuthenticated(true);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
          setIsAdminAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao parsear dados do utilizador:', error);
        // Limpar dados corrompidos
        localStorage.removeItem(config.AUTH.TOKEN_KEY);
        localStorage.removeItem(config.AUTH.USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem(config.AUTH.TOKEN_KEY, token);
    localStorage.setItem(config.AUTH.USER_KEY, JSON.stringify(userData));
    setUser(userData);
    
    if (userData.role === 'admin') {
      setIsAdminAuthenticated(true);
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      setIsAdminAuthenticated(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(config.AUTH.TOKEN_KEY);
    localStorage.removeItem(config.AUTH.USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setIsAdminAuthenticated(false);
    // Redirecionar para a página de login apropriada
    window.location.href = '/admin/login';
  };

  const value = {
    isAuthenticated,
    isAdminAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
