import React, { useState, useEffect } from 'react';
import { parceiroService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const StockFileDownloader = () => {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [stockFileInfo, setStockFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Carregar informações do ficheiro de stock
  const fetchStockFileInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await parceiroService.getStockFileInfo();
      setStockFileInfo(response.file);
    } catch (error) {
      console.error('Erro ao carregar informações do ficheiro de stock:', error);
      setError(error.message || 'Erro ao carregar informações do ficheiro');
      setStockFileInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só fazer a chamada se a autenticação estiver completa e o utilizador autenticado
    if (!authLoading && isAuthenticated) {
      fetchStockFileInfo();
    } else if (!authLoading && !isAuthenticated) {
      // Se não está autenticado, limpar estado
      setStockFileInfo(null);
      setLoading(false);
      setError('');
    }
  }, [authLoading, isAuthenticated]);

  // Formatar tamanho do ficheiro
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  // Fazer download do ficheiro
  const handleDownload = async () => {
    try {
      setError(''); // Limpar erros anteriores
      await parceiroService.downloadStockFile();
    } catch (error) {
      console.error('Erro no download:', error);
      setError('Erro ao fazer download do ficheiro: ' + (error.message || 'Erro desconhecido'));
    }
  };

  if (loading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="space-y-4">
            <Skeleton width={200} height={24} />
            <Skeleton width={300} height={16} />
            <div className="flex space-x-4 mt-4">
              <Skeleton width={120} height={40} />
              <Skeleton width={100} height={20} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar informações</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchStockFileInfo}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stockFileInfo) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Mapa de Stock Não Disponível
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              O mapa de stock não se encontra disponível de momento. Por favor, verifique mais tarde ou contacte o administrador.
            </p>
            <button
              onClick={fetchStockFileInfo}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center mx-auto"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Verificar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <svg className="h-5 w-5 mr-2 my-text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Mapa de Stock Disponível
        </h3>
      </div>
      
      <div className="p-6">
        {/* Mensagem de erro de download */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 mb-4 lg:mb-0">
            <div className="space-y-3">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-gray-700">Nome do ficheiro:</span>
                  <p className="text-gray-900 font-medium">{stockFileInfo.display_name}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-gray-700">Tamanho:</span>
                  <p className="text-gray-900">{formatFileSize(stockFileInfo.size)}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-gray-700">Última atualização:</span>
                  <p className="text-gray-900">{formatDate(stockFileInfo.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:ml-6">
            <button
              onClick={handleDownload}
              className="w-full lg:w-auto my-bg-red text-white px-6 py-3 rounded-md hover: transition-colors cursor-pointer flex items-center justify-center font-medium text-lg"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Baixar Agora
            </button>
          </div>
        </div>
        
        <div className="mt-6 p-4 my-bg-red-op rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 my-text-gray-sub mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="my-text-gray font-medium">Informação</p>
              <p className="my-text-gray-sub mt-1">
                Este ficheiro contém informações atualizadas sobre o stock disponível. 
                Certifique-se de que tem o Microsoft Excel ou uma aplicação compatível instalada para visualizar o ficheiro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockFileDownloader;
