import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { config } from '../config/config';
import { authService } from '../services/api'; // Certifique-se que o authService é importado

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Estado de carregamento da sessão

  // Função para validar a sessão ao carregar a aplicação
  const validateSession = useCallback(async () => {
    const token = localStorage.getItem(config.AUTH.TOKEN_KEY);

    if (token) {
      try {
        // Tenta buscar os dados do utilizador com o token guardado
        const response = await authService.getAuthenticatedUser();
        const userData = response.data;
        
        // Se a chamada for bem-sucedida, o token é válido. Inicia a sessão.
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.role === 'admin');
        console.log('Sessão validada com sucesso:', userData.name);
      } catch (error) {
        // Se falhar (ex: 401), o token é inválido ou expirado
        console.error("Falha na validação da sessão. A limpar token inválido.", error.message);
        localStorage.removeItem(config.AUTH.TOKEN_KEY);
        localStorage.removeItem(config.AUTH.USER_KEY);
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    } else {
      // Não há token, garantir que o estado está limpo
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
    // Finaliza o carregamento, permitindo a renderização da aplicação
    setLoading(false);
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const login = (userData, token) => {
    localStorage.setItem(config.AUTH.TOKEN_KEY, token);
    localStorage.setItem(config.AUTH.USER_KEY, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setIsAdmin(userData.role === 'admin');
  };

  const logout = () => {
    localStorage.removeItem(config.AUTH.TOKEN_KEY);
    localStorage.removeItem(config.AUTH.USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    
    // O redirecionamento pode ser tratado nos próprios componentes ou aqui
    // window.location.href = config.ROUTES.LOGIN;
  };

  const value = {
    isAuthenticated,
    isAdmin,
    user,
    loading, // Expor o estado de loading
    login,
    logout,
  };

  // Renderiza os filhos apenas quando a validação da sessão estiver concluída
  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">A validar sessão...</span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};