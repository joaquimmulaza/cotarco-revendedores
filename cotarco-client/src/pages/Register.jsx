import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/api';
import { config } from '../config/config';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import logoCotarco from '../assets/logo-cotarco.png';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      company: '',
      role: '',
      alvara: null
    }
  });

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('As palavras-passe não coincidem');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('password_confirmation', data.confirmPassword);
      formData.append('phone_number', data.phone);
      formData.append('company_name', data.company);
      formData.append('role', data.role);
      if (data.alvara && data.alvara[0]) {
        formData.append('alvara', data.alvara[0]);
      }

      const response = await authService.registerRevendedor(formData);

      console.log('Registro bem-sucedido:', response);
      navigate(config.ROUTES.EMAIL_VERIFICATION_PENDING);
    } catch (error) {
      console.error('Erro no registro:', error);
      // Trata mensagens de validação 422 do Laravel
      if (error.errors) {
        setFieldErrors(error.errors);
        const firstField = Object.keys(error.errors)[0];
        if (firstField && Array.isArray(error.errors[firstField])) {
          setError(error.errors[firstField][0]);
        } else {
          setError('Corrija os campos destacados.');
        }
      } else {
        setError(error.message || 'Erro ao registrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo da Cotarco */}
        <div className="text-center mb-6">
          <img 
            src={logoCotarco} 
            alt="Cotarco - Tecnologias e Comércio Geral" 
            className="h-16 w-auto mx-auto mb-4"
          />
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Registo de Parceiro
        </h2>
      
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Nome completo é obrigatório' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  type="tel"
                  {...register('phone', { required: 'Telefone é obrigatório' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
                {fieldErrors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.phone_number[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Nome da Empresa
              </label>
              <div className="mt-1">
                <input
                  id="company"
                  type="text"
                  {...register('company', { required: 'Nome da empresa é obrigatório' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                )}
                {fieldErrors.company_name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.company_name[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Tipo de Conta
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  {...register('role', { required: 'Tipo de conta é obrigatório' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="">Selecione uma opção...</option>
                  <option value="revendedor">Revendedor</option>
                  <option value="distribuidor">Distribuidor</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
                {fieldErrors.role && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.role[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="alvara" className="block text-sm font-medium text-gray-700">
                Alvará (PDF, JPG, PNG)
              </label>
              <div className="mt-1">
                <input
                  id="alvara"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  {...register('alvara', { required: 'Alvará é obrigatório' })}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer focus:outline-none"
                />
                {errors.alvara && (
                  <p className="mt-1 text-sm text-red-600">{errors.alvara.message}</p>
                )}
                {fieldErrors.alvara && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.alvara[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Palavra-passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'Palavra-passe é obrigatória',
                    minLength: {
                      value: 8,
                      message: 'Palavra-passe deve ter pelo menos 8 caracteres'
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar palavra-passe
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', { 
                    required: 'Confirmação da palavra-passe é obrigatória',
                    validate: (value) => value === watch('password') || 'As palavras-passe não coincidem'
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white my-bg-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    A registar...
                  </div>
                ) : (
                  'Registar'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-primary hover:text-red-700"
              >
                Já tem conta? Faça login aqui
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

