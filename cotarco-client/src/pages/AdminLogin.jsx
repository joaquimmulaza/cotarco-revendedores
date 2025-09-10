import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { authService } from '../services/api';
import { config } from '../config/config';
import { useAuth } from '../contexts/AuthContext';
import logoCotarco from '../assets/logo-cotarco.png';
import loginImage from '../assets/login-cotarco-distributor.webp';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Variantes de animação para o painel da imagem
  const imagePanelVariants = {
    hidden: { 
      opacity: 0, 
      x: -50 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut"
      }
    }
  };

  // Variantes para o contentor do formulário
  const formContainerVariants = {
    hidden: { 
      opacity: 0 
    },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  // Variantes para os elementos individuais do formulário
  const formItemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      const response = await authService.loginAdmin(formData);
      console.log('Login de administrador bem-sucedido:', response);
      
      // Atualizar o estado de autenticação através do contexto
      login(response.user, response.token);
      
      // Redirecionar para o dashboard
      navigate(config.ROUTES.ADMIN_DASHBOARD);
    } catch (error) {
      console.error('Erro no login de administrador:', error);
      
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
      <motion.div 
        className="hidden lg:flex lg:flex-1 relative"
        variants={imagePanelVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Imagem de fundo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
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
      </motion.div>

      {/* Lado direito com formulário */}
      <motion.div 
        className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8"
        variants={formContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo da Cotarco */}
          <motion.div 
            className="text-center mb-6"
            variants={formItemVariants}
          >
            <img 
              src={logoCotarco} 
              alt="Cotarco - Tecnologias e Comércio Geral" 
              className="h-16 w-auto mx-auto mb-4"
            />
          </motion.div>
          
          <motion.div 
            className="text-center"
            variants={formItemVariants}
          >
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-600">
              Painel de Administração
            </h2>
          </motion.div>
        </div>

        <motion.div 
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
          variants={formItemVariants}
        >
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-primary">
            {error && (
              <motion.div 
                className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <motion.div variants={formItemVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email do Administrador
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
                    placeholder="admin@cotarco.com"
                  />
                </div>
              </motion.div>

              <motion.div variants={formItemVariants}>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Palavra-passe
                </label>
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
              </motion.div>

              <motion.div variants={formItemVariants}>
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer w-full my-bg-red flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover: focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'A entrar...' : 'Entrar no Painel'}
                </button>
              </motion.div>
            </form>

            <motion.div 
              className="mt-6"
              variants={formItemVariants}
            >
              <div className="text-center">
                <Link
                  to="/"
                  className="font-medium text-gray-600 hover:text-gray-800"
                >
                  ← Voltar ao site principal
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;