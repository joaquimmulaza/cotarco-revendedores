import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { config } from '../config/config';
import logoCotarco from '../assets/logo-cotarco.png';

const EmailVerificationError = () => {
  const [searchParams] = useSearchParams();
  const [reason, setReason] = useState('error');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const errorReason = searchParams.get('reason') || 'error';
    setReason(errorReason);

    switch (errorReason) {
      case 'expired':
        setMessage('O link de verificação expirou. Por favor, solicite um novo link de verificação.');
        break;
      case 'invalid':
        setMessage('O link de verificação é inválido. Por favor, solicite um novo link de verificação.');
        break;
      case 'error':
        setMessage('Ocorreu um erro durante a verificação. Por favor, tente novamente.');
        break;
      default:
        setMessage('Ocorreu um erro inesperado. Por favor, tente novamente.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            className="h-16 w-auto"
            src={logoCotarco}
            alt="Cotarco"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Erro na Verificação de Email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Verificação Falhou
            </h3>
            
            <p className="text-sm text-gray-600 mb-6">
              {message}
            </p>

            <div className="space-y-3">
              <Link
                to={config.ROUTES.LOGIN}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ir para Login
              </Link>
              
              <Link
                to={config.ROUTES.REGISTER}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Criar Nova Conta
              </Link>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>
                Se o problema persistir, entre em contato com o suporte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationError;
