import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { config } from '../config/config';
import { authService } from '../services/api'; // Certifique-se que o authService é importado
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
             <div className="min-h-screen bg-gray-50">
               {/* Header Skeleton */}
               <div className="bg-white shadow-sm border-b border-gray-200">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                   <div className="flex justify-between items-center py-4">
                     <div className="flex items-center space-x-4">
                       <Skeleton width={128} height={48} />
                       <Skeleton width={128} height={40} />
                     </div>
                     <div className="flex items-center space-x-4">
                       <div className="text-right">
                         <Skeleton width={96} height={16} />
                         <Skeleton width={128} height={12} />
                       </div>
                       <Skeleton width={80} height={40} />
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Main Content Skeleton */}
               <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                 <div className="px-4 py-6 sm:px-0">
                   {/* Stats Skeleton */}
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                     {Array.from({ length: 4 }).map((_, index) => (
                       <div key={index} className="bg-white overflow-hidden shadow rounded-lg p-5">
                         <div className="flex items-center">
                           <div className="flex-shrink-0">
                             <Skeleton width={32} height={32} />
                           </div>
                           <div className="ml-5 w-0 flex-1">
                             <Skeleton width={96} height={16} className="mb-2" />
                             <Skeleton width={64} height={24} />
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   {/* Content Skeleton */}
                   <div className="bg-white shadow rounded-lg p-6">
                     <Skeleton width={192} height={24} className="mb-4" />
                     <Skeleton height={128} />
                   </div>
                 </div>
               </main>
             </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};