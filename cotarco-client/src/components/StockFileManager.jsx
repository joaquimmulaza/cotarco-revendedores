import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Dialog, Transition, TransitionChild } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DialogPanel, DialogTitle } from '@headlessui/react';

const StockFileManager = () => {
  const { loading: authLoading, isAdmin } = useAuth();
  const [stockFiles, setStockFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [targetBusinessModel, setTargetBusinessModel] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Estados para diálogos de confirmação
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '', // 'toggle' ou 'delete'
    fileId: null,
    fileName: '',
    isActive: false
  });
  

  // Carregar dados dos ficheiros
  const fetchStockFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getStockFiles();
      setStockFiles(response.files || []);
    } catch (error) {
      console.error('Erro ao carregar ficheiros de stock:', error);
      setError(error.message || 'Erro ao carregar dados dos ficheiros');
      setStockFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchStockFiles();
    }
  }, [authLoading, isAdmin]);

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
    
    if (!selectedFile || !displayName.trim() || !targetBusinessModel) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setUploadLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('display_name', displayName.trim());
      formData.append('target_business_model', targetBusinessModel);
      
      await adminService.uploadStockFile(formData);
      
      setSuccessMessage('Ficheiro de stock carregado com sucesso!');
      setSelectedFile(null);
      setDisplayName('');
      setTargetBusinessModel('');
      
      // Limpar o input de ficheiro
      const fileInput = document.getElementById('stock-file-input');
      if (fileInput) fileInput.value = '';
      
      // Recarregar dados
      await fetchStockFiles();
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setError(error.message || 'Erro ao carregar ficheiro');
    } finally {
      setUploadLoading(false);
    }
  };

  // Abrir diálogo de confirmação
  const openConfirmDialog = (type, fileId, fileName, isActive = false) => {
    setConfirmDialog({
      isOpen: true,
      type,
      fileId,
      fileName,
      isActive
    });
  };

  // Fechar diálogo de confirmação
  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      type: '',
      fileId: null,
      fileName: '',
      isActive: false
    });
  };

  // Confirmar ação
  const confirmAction = async () => {
    if (confirmDialog.type === 'toggle') {
      await handleToggleStatus(confirmDialog.fileId);
    } else if (confirmDialog.type === 'delete') {
      await handleDelete(confirmDialog.fileId);
    }
    closeConfirmDialog();
  };

  // Alterar status do ficheiro
  const handleToggleStatus = async (fileId) => {
    try {
      setActionLoading(true);
      setError('');
      
      await adminService.toggleStockFileStatus(fileId);
      
      setSuccessMessage('Status do ficheiro alterado com sucesso!');
      
      // Recarregar dados
      await fetchStockFiles();
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setError(error.message || 'Erro ao alterar status do ficheiro');
    } finally {
      setActionLoading(false);
    }
  };

  // Apagar ficheiro
  const handleDelete = async (fileId) => {
    try {
      setActionLoading(true);
      setError('');
      
      await adminService.deleteStockFile(fileId);
      
      setSuccessMessage('Ficheiro apagado com sucesso!');
      
      // Atualizar estado removendo o ficheiro da lista
      setStockFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      
    } catch (error) {
      console.error('Erro ao apagar ficheiro:', error);
      setError(error.message || 'Erro ao apagar ficheiro');
    } finally {
      setActionLoading(false);
    }
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
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Skeleton width={32} height={20} className="mr-2" />
            <Skeleton width={192} height={24} />
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-4">
            <Skeleton height={128} />
            <div className="flex space-x-4">
              <Skeleton width={128} height={40} />
              <Skeleton width={128} height={40} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 flex items-center">
          <svg className="h-5 w-5 mr-2 my-text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Se não existem ficheiros - mostrar formulário de upload */}
        {stockFiles.length === 0 ? (
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
                  className="cursor-pointer block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:cursor-pointer file:font-medium file:bg-gray-200 file:text-gray-600 hover:file:bg-gray-300"
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
              
              <div>
                <label htmlFor="target-business-model" className="block text-sm font-medium text-gray-700 mb-2">
                  Destinatário <span className="text-red-500">*</span>
                </label>
                <select
                  id="target-business-model"
                  value={targetBusinessModel}
                  onChange={(e) => setTargetBusinessModel(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione o destinatário</option>
                  <option value="B2C">B2C</option>
                  <option value="B2B">B2B</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={uploadLoading || !selectedFile || !displayName.trim() || !targetBusinessModel}
                className="cursor-pointer w-full bg-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
          /* Se existem ficheiros - mostrar tabela e opções */
          <div className="space-y-6">
            {/* Tabela de ficheiros */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-700 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Ficheiros de Stock
                </h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome do Ficheiro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destinatário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data de Upload
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {file.original_filename}
                          </div>
                         
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {file.target_business_model === 'B2C' ? 'B2C' : 
                             file.target_business_model === 'B2B' ? 'B2B' : 
                             'Não especificado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(file.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            file.is_active 
                              ? 'bg-green-50 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {file.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => openConfirmDialog('toggle', file.id, file.display_name, file.is_active)}
                            disabled={actionLoading}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${
                              file.is_active
                                ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                            }`}
                          >
                            {file.is_active ? 'Desativar' : 'Ativar'}
                          </button>
                          
                          <button
                            onClick={() => openConfirmDialog('delete', file.id, file.display_name)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Apagar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Formulário para adicionar novo ficheiro */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-700 mb-4">
                Adicionar Novo Ficheiro de Stock
              </h4>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="replace-file-input" className="block text-sm font-medium text-gray-700 mb-2">
                      Novo ficheiro Excel
                    </label>
                    <input
                      id="replace-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="cursor-pointer block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-200 file:text-gray-600 file:cursor-pointer hover:file:bg-gray-300"
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
                  
                  <div>
                    <label htmlFor="replace-target-business-model" className="block text-sm font-medium text-gray-700 mb-2">
                      Destinatário <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="replace-target-business-model"
                      value={targetBusinessModel}
                      onChange={(e) => setTargetBusinessModel(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione o destinatário</option>
                      <option value="B2C">B2C</option>
                      <option value="B2B">B2B</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={uploadLoading || !selectedFile || !displayName.trim() || !targetBusinessModel}
                  className="cursor-pointer bg-gray-200 text-gray-600 px-6 py-2 rounded-md hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center"
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
                      Adicionar Ficheiro
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* Diálogo de Confirmação */}
      <Transition appear show={confirmDialog.isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeConfirmDialog}>
          <TransitionChild
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        {confirmDialog.type === 'delete' ? 'Confirmar Exclusão' : 'Confirmar Alteração de Status'}
                      </DialogTitle>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      {confirmDialog.type === 'delete' 
                        ? `Tem certeza que deseja apagar o ficheiro "${confirmDialog.fileName}"? Esta ação não pode ser desfeita.`
                        : `Tem certeza que deseja ${confirmDialog.isActive ? 'desativar' : 'ativar'} o ficheiro "${confirmDialog.fileName}"?`
                      }
                    </p>
                  </div>

                  <div className="mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent my-bg-red px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={confirmAction}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processando...
                        </>
                      ) : (
                        confirmDialog.type === 'delete' ? 'Apagar' : (confirmDialog.isActive ? 'Desativar' : 'Ativar')
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={closeConfirmDialog}
                      disabled={actionLoading}
                    >
                      Cancelar
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
      
    </div>
  );
};

export default StockFileManager;
