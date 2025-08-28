import React, { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  
  // Estados para gestão de dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revendedores, setRevendedores] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  
  // Estados para navegação e paginação
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  // Mapear índices de tabs para status
  const tabStatusMap = ['pending_approval', 'active', 'rejected'];
  const currentStatus = tabStatusMap[selectedTabIndex];
  
  // Estados para estatísticas
  const [stats, setStats] = useState({
    revendedores: {
      pending_approval: 0,
      active: 0,
      rejected: 0,
      inactive: 0,
      total: 0
    },
    sales: { total_this_month: 0 },
    orders: { active_count: 0 }
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminService.getDashboardStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRevendedores = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getRevendedores(currentStatus, currentPage);
      setRevendedores(response.data || []);
      setPagination(response.pagination || null);
    } catch (error) {
      console.error('Erro ao carregar revendedores:', error);
      setError(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [currentStatus, currentPage]);

  // Carregar estatísticas (apenas uma vez no carregamento)
  useEffect(() => {
    fetchStats();
  }, []);

  // Carregar revendedores (sempre que status ou página mudar)
  useEffect(() => {
    fetchRevendedores();
  }, [fetchRevendedores]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: `updating-${newStatus}` }));
      await adminService.updateRevendedorStatus(id, newStatus);
      
      // Refazer busca dos dados após atualização
      await Promise.all([fetchRevendedores(), fetchStats()]);
      
    } catch (error) {
      console.error('Erro ao atualizar status do revendedor:', error);
      alert(error.message || 'Erro ao atualizar status do revendedor');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleTabChange = (index) => {
    setSelectedTabIndex(index);
    setCurrentPage(1); // Reset página ao mudar tab
  };

  const handleViewAlvara = (userId) => {
    adminService.viewAlvara(userId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 text-primary mr-3">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel de Administração
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.name || 'Administrador'}
              </span>
              <button 
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

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
                        {statsLoading ? '...' : stats.revendedores.pending_approval}
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
                        Revendedores ativos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statsLoading ? '...' : stats.revendedores.active}
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
                        {statsLoading ? '...' : stats.sales.total_this_month}
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
                        {statsLoading ? '...' : stats.orders.active_count}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revendedores Management */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Gestão de Revendedores
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
                    Pendentes ({statsLoading ? '...' : stats.revendedores.pending_approval})
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
                    Ativos ({statsLoading ? '...' : stats.revendedores.active})
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
                    Rejeitados ({statsLoading ? '...' : stats.revendedores.rejected})
                  </Tab>
                </Tab.List>
              </Tab.Group>
            </div>
            <div className="px-6 py-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">A carregar revendedores...</span>
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
                    {currentStatus === 'pending_approval' && 'Nenhum revendedor pendente'}
                    {currentStatus === 'active' && 'Nenhum revendedor ativo'}
                    {currentStatus === 'rejected' && 'Nenhum revendedor rejeitado'}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {currentStatus === 'pending_approval' && 'No momento não há revendedores aguardando aprovação.'}
                    {currentStatus === 'active' && 'No momento não há revendedores ativos no sistema.'}
                    {currentStatus === 'rejected' && 'No momento não há revendedores rejeitados.'}
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
                              </div>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Registado em {formatDate(revendedor.created_at)}
                              </span>
                            </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-700 w-16">Email:</span>
                              <span className="text-gray-600">{revendedor.email}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-700 w-20">Empresa:</span>
                              <span className="text-gray-600">{revendedor.profile?.company_name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-700 w-20">Telefone:</span>
                              <span className="text-gray-600">{revendedor.profile?.phone_number || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-6">
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
    </div>
  );
};

export default AdminDashboard;

