import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { config } from '../config/config';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import logoCotarco from '../assets/logo-cotarco.png';
import loginImage from '../assets/login-cotarco-distributor.webp';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      const response = await authService.loginPartner(formData);
      console.log('Login bem-sucedido:', response);
      
      // Atualizar o estado de autenticação através do contexto
      login(response.user, response.token);
      
      // Redirecionar para o dashboard
      navigate(config.ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Tratar diferentes tipos de erro
      let errorMessage = 'Credenciais inválidas. Tente novamente.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Email ou palavra-passe incorretos.';
      } else if (error.response?.status === 403) {
        errorMessage = error.message || 'Acesso negado. Verifique as suas permissões.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Lado esquerdo com imagem de fundo - oculto em mobile */}
      <div className="hidden lg:flex lg:flex-1 relative">
        {/* Imagem de fundo */}
        <div 
          className="absolute  inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${loginImage})`
          }}
        />
        
        {/* Título sobreposto */}
        <div className="relative z-10 flex items-center justify-center w-full">
          <h1 className="text-5xl font-bold text-white text-center leading-tight drop-shadow-lg">
            Distribua<br />
            <span className="my-text-red drop-shadow-lg">Qualidade</span><br />
            e Inovação
          </h1>
        </div>
      </div>

      {/* Lado direito com formulário */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo da Cotarco */}
          <div className="text-center mb-6">
            <img 
              src={logoCotarco} 
              alt="Cotarco - Tecnologias e Comércio Geral" 
              className="h-16 w-auto mx-auto mb-4"
            />
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-600">
            Iniciar sessão
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Palavra-passe
                  </label>
                </div>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <Link
                    to="/forgot-password"
                    className="text-sm text-red-600 hover:text-red-500 transition-colors"
                  >
                    Esqueci a senha
                  </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white my-bg-red hover: focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      A entrar...
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <Link
                  to="/register"
                  className="font-medium text-gray-600 hover:text-red-700"
                >
                  Não tem conta? Registe-se aqui
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;