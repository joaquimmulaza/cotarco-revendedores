import React, { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';
import StockFileManager from '../components/StockFileManager';
import Header from '../components/Header';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, logout, loading: authLoading, isAdmin } = useAuth();
  
  console.log('AdminDashboard renderizado:', { user, authLoading, isAdmin });
  
  // Estados para gestão de dados
  const [loading, setLoading] = useState(true); // Loading para parceiros
  const [error, setError] = useState(''); // Erro ao carregar parceiros
  const [revendedores, setRevendedores] = useState([]); // Array de parceiros (revendedores e distribuidores)
  const [actionLoading, setActionLoading] = useState({}); // Loading para ações de parceiros
  
  // Estados para navegação e paginação (para revendedores e distribuidores)
  const [selectedTabIndex, setSelectedTabIndex] = useState(0); // Tab selecionada para parceiros
  const [currentPage, setCurrentPage] = useState(1); // Página atual de parceiros
  const [pagination, setPagination] = useState(null); // Paginação de parceiros
  
  // Estados para o modal de edição (de revendedores e distribuidores)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Modal de edição de parceiro
  const [editingPartner, setEditingPartner] = useState(null); // Parceiro sendo editado
  const [editFormData, setEditFormData] = useState({
    role: '', // Role do parceiro (revendedor ou distribuidor)
    business_model: '' // Modelo de negócio do parceiro
  });
  const [editLoading, setEditLoading] = useState(false); // Loading para edição de parceiro
  
  // Mapear índices de tabs para status (para revendedores e distribuidores)
  const tabStatusMap = ['pending_approval', 'active', 'rejected', 'inactive'];
  const currentStatus = tabStatusMap[selectedTabIndex];
  
  // Estados para estatísticas (de revendedores e distribuidores)
  const [stats, setStats] = useState({
    parceiros: {
      pending_approval: 0,
      active: 0,
      rejected: 0,
      inactive: 0,
      total: 0
    },
    sales: { total_this_month: 0 },
    orders: { active_count: 0 }
  });
  const [statsLoading, setStatsLoading] = useState(true); // Loading para estatísticas de parceiros

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminService.getDashboardStats();
      // Garantir que a estrutura de dados seja válida (para revendedores e distribuidores)
      if (response.data) {
        setStats({
          parceiros: {
            pending_approval: response.data.parceiros?.pending_approval || 0,
            active: response.data.parceiros?.active || 0,
            rejected: response.data.parceiros?.rejected || 0,
            inactive: response.data.parceiros?.inactive || 0,
            total: response.data.parceiros?.total || 0
          },
          sales: {
            total_this_month: response.data.sales?.total_this_month || 0
          },
          orders: {
            active_count: response.data.orders?.active_count || 0
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas do painel');
      // Em caso de erro, manter o estado inicial
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRevendedores = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getRevendedores(currentStatus, currentPage);
      setRevendedores(response.data || []); // Dados de revendedores e distribuidores
      setPagination(response.pagination || null);
      
      // Atualizar estatísticas após carregar parceiros para manter contadores sincronizados
      if (!authLoading && isAdmin) {
        fetchStats();
      }
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error);
      const errorMessage = error.message || 'Erro ao carregar dados';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, currentPage, authLoading, isAdmin]);

  // Carregar estatísticas (apenas uma vez no carregamento, após autenticação)
  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchStats(); // Estatísticas de revendedores e distribuidores
      
      // Atualizar estatísticas automaticamente a cada 30 segundos
      const interval = setInterval(() => {
        fetchStats();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [authLoading, isAdmin]);



  // Carregar revendedores e distribuidores (sempre que status ou página mudar, após autenticação)
  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchRevendedores();
    }
  }, [fetchRevendedores, authLoading, isAdmin]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPartner) return;

    try {
      setEditLoading(true);
      
      // Chamar a API para atualizar o parceiro (revendedor ou distribuidor)
      await adminService.updatePartner(editingPartner.id, editFormData);
      
      // Fechar modal e atualizar dados
      closeEditModal();
      
      // Atualizar a lista de parceiros E as estatísticas
      await Promise.all([
        fetchRevendedores(),
        fetchStats()
      ]);
      
      // Mostrar mensagem de sucesso
      toast.success('Parceiro atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao atualizar parceiro:', error);
      toast.error(error.message || 'Erro ao atualizar parceiro');
    }
  };

  const handleTabChange = (index) => {
    setSelectedTabIndex(index);
    setCurrentPage(1); // Reset página ao mudar tab (para revendedores e distribuidores)
    
    // Atualizar estatísticas quando mudar de tab para garantir dados atualizados
    if (!authLoading && isAdmin) {
      fetchStats();
    }
  };

  // Altere esta função para ser assíncrona e usar o novo serviço
  const handleViewAlvara = async (userId) => {
    try {
      toast.loading('A preparar o alvará para download...'); // Notificação de loading
      await adminService.downloadAlvara(userId);
      toast.dismiss(); // Remove a notificação de loading
      toast.success('Download do alvará iniciado!');
    } catch (error) {
      toast.dismiss(); // Remove a notificação de loading
      toast.error(error.message || 'Não foi possível baixar o alvará.');
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: `updating-${newStatus}` }));
      
      // Chamar a API para atualizar o status do parceiro (revendedor ou distribuidor)
      await adminService.updateRevendedorStatus(userId, newStatus);
      
      // Atualizar a lista de parceiros E as estatísticas
      await Promise.all([
        fetchRevendedores(),
        fetchStats()
      ]);
      
      // Mostrar mensagem de sucesso
      toast.success('Status do parceiro atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao atualizar status do parceiro:', error);
      toast.error(error.message || 'Erro ao atualizar status do parceiro');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Funções para o modal de edição
  const openEditModal = (partner) => {
    setEditingPartner(partner); // partner pode ser revendedor ou distribuidor
    setEditFormData({
      role: partner.role || '', // Role do parceiro
      business_model: partner.profile?.business_model || '' // Modelo de negócio do parceiro
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPartner(null);
    setEditFormData({ role: '', business_model: '' }); // Reset dados do parceiro
    setEditLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    try {
      // Formatar data de registo de revendedor ou distribuidor
      return new Date(dateString).toLocaleDateString('pt-PT');
    } catch {
      return 'Data inválida';
    }
  };
  
  const formatBusinessModel = (businessModel) => {
    if (!businessModel) return 'Não definido';
    // Formatar modelo de negócio de revendedor ou distribuidor
    return businessModel;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        user={user}
        onLogout={logout}
        title="Painel de Administração - Gestão de Parceiros"
        isAdmin={true}
        loading={authLoading}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-yellow-500">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Solicitações pendentes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statsLoading ? (
                          <Skeleton width={32} height={24} />
                        ) : (
                          stats.parceiros?.pending_approval || 0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-green-500">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Parceiros ativos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statsLoading ? (
                          <Skeleton width={32} height={24} />
                        ) : (
                          stats.parceiros?.active || 0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-primary">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Vendas totais este mês
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statsLoading ? (
                          <Skeleton width={64} height={24} />
                        ) : (
                          stats.sales?.total_this_month || 0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-blue-500">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Encomendas ativas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statsLoading ? (
                          <Skeleton width={40} height={24} />
                        ) : (
                          stats.orders?.active_count || 0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock File Management */}
          <div className="mb-8">
            <StockFileManager />
          </div>

          {/* Parceiros Management */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Gestão de Parceiros (Revendedores e Distribuidores)
              </h3>
              
              {/* Headless UI Tabs */}
              <Tab.Group selectedIndex={selectedTabIndex} onChange={handleTabChange}>
                <Tab.List className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <Tab
                    className={({ selected }) =>
                      `px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selected
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    Pendentes ({statsLoading ? '...' : stats.parceiros?.pending_approval || 0})
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selected
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    Ativos ({statsLoading ? '...' : stats.parceiros?.active || 0})
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selected
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    Rejeitados ({statsLoading ? '...' : stats.parceiros?.rejected || 0})
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selected
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    Desativados ({statsLoading ? '...' : stats.parceiros?.inactive || 0})
                  </Tab>
                </Tab.List>
              </Tab.Group>
            </div>
            <div className="px-6 py-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Skeleton width={128} height={24} />
                              <Skeleton width={80} height={20} />
                              <Skeleton width={96} height={20} />
                            </div>
                            <Skeleton width={128} height={20} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="flex items-center">
                                <Skeleton width={64} height={16} className="mr-2" />
                                <Skeleton width={96} height={16} />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-6">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} width={80} height={32} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 mb-4">
                    <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchRevendedores}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : revendedores.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {currentStatus === 'pending_approval' && 'Nenhum parceiro pendente'}
                    {currentStatus === 'active' && 'Nenhum parceiro ativo'}
                    {currentStatus === 'rejected' && 'Nenhum parceiro rejeitado'}
                    {currentStatus === 'inactive' && 'Nenhum parceiro desativado'}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {currentStatus === 'pending_approval' && 'No momento não há revendedores ou distribuidores aguardando aprovação.'}
                    {currentStatus === 'active' && 'No momento não há revendedores ou distribuidores ativos no sistema.'}
                    {currentStatus === 'rejected' && 'No momento não há revendedores ou distribuidores rejeitados.'}
                    {currentStatus === 'inactive' && 'No momento não há revendedores ou distribuidores que foram desativados.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {revendedores.map((revendedor) => (
                      <div key={revendedor.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-xl font-semibold text-gray-900">
                                  {revendedor.name}
                                </h4>
                                {/* Status Badge */}
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  revendedor.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                  revendedor.status === 'active' ? 'bg-green-100 text-green-800' :
                                  revendedor.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {revendedor.status === 'pending_approval' ? 'Pendente' :
                                   revendedor.status === 'active' ? 'Ativo' :
                                   revendedor.status === 'rejected' ? 'Rejeitado' :
                                   revendedor.status}
                                </span>
                                
                                {/* Role Badge */}
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  revendedor.role === 'revendedor' ? 'bg-blue-100 text-blue-800' :
                                  revendedor.role === 'distribuidor' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {revendedor.role === 'revendedor' ? 'Revendedor' :
                                   revendedor.role === 'distribuidor' ? 'Distribuidor' :
                                   revendedor.role}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Registado em {formatDate(revendedor.created_at)}
                              </span>
                            </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 text-sm">
                            <div className="flex items-start space-x-3">
                              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Email:</span>
                              <span className="text-gray-600 break-all">{revendedor.email}</span>
                            </div>
                            <div className="flex items-start space-x-3">
                              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Empresa:</span>
                              <span className="text-gray-600">{revendedor.profile?.company_name || 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-3">
                              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Telefone:</span>
                              <span className="text-gray-600">{revendedor.profile?.phone_number || 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-3">
                              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Modelo:</span>
                              <span className="text-gray-600">{formatBusinessModel(revendedor.profile?.business_model)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-6">
                          {/* Botão Editar */}
                          <button
                            onClick={() => openEditModal(revendedor)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center"
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>

                          {revendedor.profile?.alvara_path ? (
                            <button
                              onClick={() => handleViewAlvara(revendedor.id)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Ver Alvará
                            </button>
                          ) : (
                            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center">
                              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Sem Alvará
                            </div>
                          )}
                          
                          {/* Botões de ação baseados no status atual */}
                          {revendedor.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(revendedor.id, 'active')}
                                disabled={actionLoading[revendedor.id]}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
                              >
                                {actionLoading[revendedor.id] === 'updating-active' ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    A aprovar...
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Aprovar
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleUpdateStatus(revendedor.id, 'rejected')}
                                disabled={actionLoading[revendedor.id]}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
                              >
                                {actionLoading[revendedor.id] === 'updating-rejected' ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    A rejeitar...
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Rejeitar
                                  </>
                                )}
                              </button>
                            </>
                          )}
                          
                          {revendedor.status === 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(revendedor.id, 'inactive')}
                              disabled={actionLoading[revendedor.id]}
                              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              {actionLoading[revendedor.id] === 'updating-inactive' ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  A desativar...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                  </svg>
                                  Desativar
                                </>
                              )}
                            </button>
                          )}

{revendedor.status === 'inactive' && (
                            <button
                              onClick={() => handleUpdateStatus(revendedor.id, 'active')}
                              disabled={actionLoading[revendedor.id]}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              {actionLoading[revendedor.id] === 'updating-active' ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  A reativar...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Reativar
                                </>
                              )}
                            </button>
                          )}
                          
                          {revendedor.status === 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(revendedor.id, 'pending_approval')}
                              disabled={actionLoading[revendedor.id]}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              {actionLoading[revendedor.id] === 'updating-pending_approval' ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  A reativar...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Reativar
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Paginação */}
                {pagination && pagination.last_page > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                        disabled={currentPage === pagination.last_page}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{pagination.from}</span> a{' '}
                          <span className="font-medium">{pagination.to}</span> de{' '}
                          <span className="font-medium">{pagination.total}</span> resultados
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Paginação">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Anterior</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                            .filter(page => {
                              const diff = Math.abs(page - currentPage);
                              return diff === 0 || diff === 1 || page === 1 || page === pagination.last_page;
                            })
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                    ...
                                  </span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                                    page === currentPage
                                      ? 'bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            ))}
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                            disabled={currentPage === pagination.last_page}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Próxima</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Edição */}
      <Dialog
        open={isEditModalOpen}
        onClose={closeEditModal}
        className="relative z-50"
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Editar Parceiro: {editingPartner?.name}
              </Dialog.Title>
            </div>

            <form onSubmit={handleEditSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Conta
                </label>
                <select
                  id="edit-role"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione uma opção...</option>
                  <option value="revendedor">Revendedor</option>
                  <option value="distribuidor">Distribuidor</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-business-model" className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo de Negócio
                </label>
                <select
                  id="edit-business-model"
                  value={editFormData.business_model}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, business_model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione uma opção...</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? 'A guardar...' : 'Guardar Alterações'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;



