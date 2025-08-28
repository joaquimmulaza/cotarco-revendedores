import { Link } from 'react-router-dom';

const EmailValidated = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-green-500">
            <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Email validado com sucesso!
          </h2>
          <p className="mt-2 text-sm text-secondary">
            O seu registo está quase completo
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto h-16 w-16 text-primary mb-4">
                <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aguarde aprovação
              </h3>
              <p className="text-gray-600 mb-4">
                O seu email foi validado com sucesso. Agora a sua conta está pendente 
                de aprovação pelos nossos administradores.
              </p>
              <p className="text-sm text-secondary">
                Será notificado por email assim que a sua conta for aprovada e poderá 
                aceder ao painel de revendedor.
              </p>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <Link
                to="/"
                className="text-primary hover:text-red-700 font-medium"
              >
                Voltar ao login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailValidated;

