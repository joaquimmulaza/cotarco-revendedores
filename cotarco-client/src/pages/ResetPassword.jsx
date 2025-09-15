import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirmation: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Extrair token e email da URL
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!token || !email) {
      toast.error('Link de redefinição inválido ou expirado.');
      navigate('/forgot-password');
      return;
    }
    
    setFormData(prev => ({ ...prev, email }));
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { email, password, passwordConfirmation } = formData;
    
    // Validações
    if (!password) {
      toast.error('Por favor, insira a nova senha.');
      return;
    }
    
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    
    if (password !== passwordConfirmation) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      const token = searchParams.get('token');
      await authService.resetPassword(token, email, password, passwordConfirmation);
      
      setIsSuccess(true);
      toast.success('Senha redefinida com sucesso. Agora pode iniciar sessão.');
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Senha Redefinida
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              A sua senha foi redefinida com sucesso.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Redirecionando para o login...
            </p>
          </div>
          
          <div className="mt-6">
            <Link
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 my-text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Redefinir Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite a sua nova senha abaixo.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nova Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Nova senha (mínimo 8 caracteres)"
            />
          </div>

          <div>
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700">
              Confirmar Nova Senha
            </label>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              required
              value={formData.passwordConfirmation}
              onChange={handleChange}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Confirmar nova senha"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white my-bg-red hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Redefinindo...
                </div>
              ) : (
                'Redefinir Senha'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-gray-600 "
            >
              Voltar ao Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;