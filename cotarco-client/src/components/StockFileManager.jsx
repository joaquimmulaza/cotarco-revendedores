import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';

const StockFileManager = () => {
  const [stockFile, setStockFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Carregar dados do ficheiro atual
  const fetchCurrentStockFile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getCurrentStockFile();
      setStockFile(response.file);
    } catch (error) {
      console.error('Erro ao carregar ficheiro de stock:', error);
      setError(error.message || 'Erro ao carregar dados do ficheiro');
      setStockFile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentStockFile();
  }, []);

  // Limpar mensagens após um tempo
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // Manipular seleção de ficheiro
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    
    if (file && !displayName) {
      // Auto-preencher nome de exibição baseado no nome do ficheiro
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setDisplayName(nameWithoutExtension);
    }
  };

  // Fazer upload do ficheiro
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !displayName.trim()) {
      setError('Por favor, selecione um ficheiro e insira um nome de exibição.');
      return;
    }

    try {
      setUploadLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('display_name', displayName.trim());
      
      await adminService.uploadStockFile(formData);
      
      setSuccessMessage('Ficheiro de stock carregado com sucesso!');
      setSelectedFile(null);
      setDisplayName('');
      
      // Limpar o input de ficheiro
      const fileInput = document.getElementById('stock-file-input');
      if (fileInput) fileInput.value = '';
      
      // Recarregar dados
      await fetchCurrentStockFile();
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setError(error.message || 'Erro ao carregar ficheiro');
    } finally {
      setUploadLoading(false);
    }
  };

  // Alterar status do ficheiro
  const handleToggleStatus = async () => {
    if (!stockFile) return;
    
    try {
      setActionLoading(true);
      setError('');
      
      await adminService.toggleStockFileStatus(stockFile.id);
      
      const newStatus = stockFile.is_active ? 'desativado' : 'ativado';
      setSuccessMessage(`Ficheiro ${newStatus} com sucesso!`);
      
      // Recarregar dados
      await fetchCurrentStockFile();
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setError(error.message || 'Erro ao alterar status do ficheiro');
    } finally {
      setActionLoading(false);
    }
  };

  // Apagar ficheiro
  const handleDelete = async () => {
    if (!stockFile) return;
    
    const confirmed = window.confirm(
      'Tem a certeza que deseja apagar este ficheiro de stock? Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;
    
    try {
      setActionLoading(true);
      setError('');
      
      await adminService.deleteStockFile(stockFile.id);
      
      setSuccessMessage('Ficheiro apagado com sucesso!');
      
      // Recarregar dados
      await fetchCurrentStockFile();
      
    } catch (error) {
      console.error('Erro ao apagar ficheiro:', error);
      setError(error.message || 'Erro ao apagar ficheiro');
    } finally {
      setActionLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">A carregar dados do mapa de stock...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Gestão do Mapa de Stock
        </h3>
      </div>
      
      <div className="px-6 py-6">
        {/* Mensagens de sucesso e erro */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}
        
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

        {/* Se não existe ficheiro - mostrar formulário de upload */}
        {!stockFile ? (
          <div className="text-center py-8">
            <div className="mb-6">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum mapa de stock carregado
              </h3>
              <p className="text-gray-600">
                Carregue um ficheiro Excel (.xlsx ou .xls) para disponibilizar aos revendedores.
              </p>
            </div>
            
            <form onSubmit={handleUpload} className="max-w-md mx-auto space-y-4">
              <div>
                <label htmlFor="stock-file-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar ficheiro Excel
                </label>
                <input
                  id="stock-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome de exibição
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Mapa de Stock Janeiro 2024"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={uploadLoading || !selectedFile || !displayName.trim()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    A carregar...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Carregar Mapa
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Se existe ficheiro - mostrar informações e opções */
          <div className="space-y-6">
            {/* Informações do ficheiro atual */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Ficheiro Atual
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Nome:</span>
                  <p className="text-gray-900 mt-1">{stockFile.display_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Ficheiro original:</span>
                  <p className="text-gray-900 mt-1">{stockFile.original_filename}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tamanho:</span>
                  <p className="text-gray-900 mt-1">{formatFileSize(stockFile.size)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Última atualização:</span>
                  <p className="text-gray-900 mt-1">{formatDate(stockFile.updated_at)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stockFile.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stockFile.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Carregado por:</span>
                  <p className="text-gray-900 mt-1">
                    {stockFile.uploaded_by?.name || 'Utilizador desconhecido'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  stockFile.is_active
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={stockFile.is_active 
                        ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                        : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      }
                    />
                  </svg>
                )}
                {stockFile.is_active ? 'Desativar' : 'Ativar'}
              </button>
              
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                Apagar
              </button>
            </div>
            
            {/* Formulário para substituir ficheiro */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Substituir Mapa de Stock
              </h4>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="replace-file-input" className="block text-sm font-medium text-gray-700 mb-2">
                      Novo ficheiro Excel
                    </label>
                    <input
                      id="replace-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="replace-display-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome de exibição
                    </label>
                    <input
                      id="replace-display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex: Mapa de Stock Janeiro 2024"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={uploadLoading || !selectedFile || !displayName.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      A substituir...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Substituir Ficheiro
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockFileManager;
