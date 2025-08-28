import { useState } from 'react';
import axios from 'axios';

const ApiTest = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testApiConnection = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      // Teste direto sem proxy
      const directResponse = await axios.get('http://localhost:8000/api/test');
      console.log('Resposta direta:', directResponse.data);
      
      // Teste através do proxy
      const proxyResponse = await axios.get('/api/test');
      console.log('Resposta via proxy:', proxyResponse.data);
      
      setTestResult('✅ Conexão bem-sucedida! Verifique o console para detalhes.');
    } catch (error) {
      console.error('Erro no teste:', error);
      setTestResult(`❌ Erro na conexão: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const testData = {
        name: 'Teste Usuário',
        email: 'teste@example.com',
        password: 'password123',
        phone: '123456789',
        company: 'Empresa Teste'
      };
      
      const response = await axios.post('/api/register', testData);
      console.log('Registro de teste:', response.data);
      setTestResult('✅ Registro de teste bem-sucedido! Verifique o console.');
    } catch (error) {
      console.error('Erro no registro de teste:', error);
      if (error.response) {
        setTestResult(`❌ Erro ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else {
        setTestResult(`❌ Erro: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Teste de Conexão com a API</h2>
      
      <div className="space-y-4">
        <button
          onClick={testApiConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testando...' : 'Testar Conexão'}
        </button>
        
        <button
          onClick={testRegister}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testando...' : 'Testar Registro'}
        </button>
        
        {testResult && (
          <div className={`p-3 rounded ${
            testResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {testResult}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Este componente testa a conexão com a API do backend.</p>
        <p>Verifique o console do navegador para detalhes das requisições.</p>
      </div>
    </div>
  );
};

export default ApiTest;



