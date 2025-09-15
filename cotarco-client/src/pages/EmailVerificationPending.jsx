import { Link } from 'react-router-dom';

const EmailVerificationPending = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-full">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-primary">
            <svg className="h-12  w-12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
          Por favor, verifique o seu e-mail
          </h2>
          <p className="mt-2 text-sm text-secondary">
          Enviámos um link de verificação para o endereço indicado.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
            Para concluir o registo e integrar a nossa rede de parceiros, basta confirmar a sua subscrição através desse link.
            Este passo é essencial para ativar a sua conta e aceder aos benefícios da parceria.
            </p>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
              <strong>Não recebeu o e-mail?</strong><br></br>
              Verifique a pasta de spam ou de correio não solicitado.
              </p>
              
              <div className="pt-4">
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
    </div>
  );
};

export default EmailVerificationPending;

