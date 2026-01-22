import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
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
  const [showPassword, setShowPassword] = useState(false);

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

  // Variantes para a imagem de fundo
  const backgroundImageVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Variantes para o título com animação palavra por palavra
  const titleVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.3,
        delayChildren: 0.5
      }
    }
  };

  // Variantes para cada palavra do título
  const wordVariants = {
    hidden: {
      opacity: 0,
      x: -200
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
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
      <motion.div
        className="hidden lg:flex lg:flex-1 relative"
        variants={imagePanelVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Imagem de fundo */}
        <motion.div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${loginImage})`
          }}
          variants={backgroundImageVariants}
          initial="hidden"
          animate="visible"
        />

        {/* Título sobreposto */}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center w-full"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="text-5xl font-bold text-white text-center leading-tight drop-shadow-lg"
            variants={wordVariants}
          >
            Distribua
          </motion.div>
          <motion.div
            className="text-5xl font-bold text-white text-center leading-tight drop-shadow-lg my-text-red"
            variants={wordVariants}
          >
            Qualidade
          </motion.div>
          <motion.div
            className="text-5xl font-bold text-white text-center leading-tight drop-shadow-lg"
            variants={wordVariants}
          >
            e Inovação
          </motion.div>
        </motion.div>
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

          <motion.h2
            className="mt-6 text-center text-3xl font-bold text-gray-600"
            variants={formItemVariants}
          >
            Iniciar sessão
          </motion.h2>
        </div>

        <motion.div
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
          variants={formItemVariants}
        >
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
              </motion.div>

              <motion.div variants={formItemVariants}>
                <div className="flex justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Palavra-passe
                  </label>
                </div>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-red-600 hover:text-red-500 transition-colors"
                >
                  Esqueci a senha
                </Link>
              </motion.div>

              <motion.div variants={formItemVariants}>
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
              </motion.div>
            </form>

            <motion.div
              className="mt-6"
              variants={formItemVariants}
            >
              <div className="text-center">
                <Link
                  to="/register"
                  className="font-medium text-gray-600 hover:text-red-700"
                >
                  Não tem conta? Registe-se aqui
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;