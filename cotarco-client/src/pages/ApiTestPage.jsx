import ApiTest from '../components/ApiTest';

const ApiTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Teste de Conexão com a API
          </h1>
          <p className="text-gray-600">
            Use esta página para testar a conexão entre o frontend e o backend
          </p>
        </div>
        
        <ApiTest />
        
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Instruções de Teste</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. <strong>Testar Conexão</strong>: Verifica se a API está respondendo</p>
            <p>2. <strong>Testar Registro</strong>: Tenta registrar um usuário de teste</p>
            <p>3. <strong>Verificar Console</strong>: Abra as ferramentas do desenvolvedor para ver detalhes</p>
            <p>4. <strong>Verificar Network</strong>: Na aba Network, veja as requisições sendo feitas</p>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Pré-requisitos</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Backend Laravel deve estar rodando em http://localhost:8000</li>
              <li>• Frontend deve estar rodando em http://localhost:5173</li>
              <li>• Banco de dados deve estar configurado e migrado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;



