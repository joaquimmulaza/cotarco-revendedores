import React, { useState, useEffect } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/api';
import { usePartners } from '../../hooks/usePartners';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import toast from 'react-hot-toast';
import PartnerList from './PartnerList';
import Pagination from './Pagination';
import EditPartnerModal from './EditPartnerModal';
import ConfirmDialog from '../ConfirmDialog';

const PartnerManager = () => {
  const { authLoading, isAdmin } = useAuth();
  
  // Estados para navegação e paginação
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  
  // Estados para o modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  
  // Estados para confirmações
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmPartner, setConfirmPartner] = useState(null);
  
  // Mapear índices de tabs para status
  const tabStatusMap = ['pending_approval', 'active', 'rejected', 'inactive'];
  const currentStatus = tabStatusMap[selectedTabIndex];
  
  // Usar o hook customizado para gerenciar dados dos parceiros
  const { partners, pagination, loading, error, refetch: fetchPartners } = usePartners(
    currentStatus, 
    currentPage, 
    isAdmin, 
    authLoading
  );
  
  // Estados para estatísticas
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
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminService.getDashboardStats();
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
    } finally {
      setStatsLoading(false);
    }
  };


  // Carregar estatísticas
  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchStats();
      
      const interval = setInterval(() => {
        fetchStats();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [authLoading, isAdmin]);

  // Atualizar estatísticas quando os parceiros mudarem
  useEffect(() => {
    if (!authLoading && isAdmin && partners.length >= 0) {
      fetchStats();
    }
  }, [partners.length, authLoading, isAdmin]);


  const handleEditSubmit = async (partnerId, formData) => {
    try {
      setEditLoading(true);
      
      await adminService.updatePartner(partnerId, formData);
      
      closeEditModal();
      
      await Promise.all([
        fetchPartners(),
        fetchStats()
      ]);
      
      toast.success('Parceiro atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao atualizar parceiro:', error);
      toast.error(error.message || 'Erro ao atualizar parceiro');
    } finally {
      setEditLoading(false);
    }
  };

  const handleTabChange = async (index) => {
    setSelectedTabIndex(index);
    setCurrentPage(1);
    
    if (!authLoading && isAdmin) {
      // Atualizar estatísticas primeiro
      await fetchStats();
      // Depois recarregar os parceiros
      fetchPartners();
    }
  };

  const handleViewAlvara = async (userId) => {
    try {
      toast.loading('A preparar o alvará para download...');
      await adminService.downloadAlvara(userId);
      toast.dismiss();
      toast.success('Download do alvará iniciado!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Não foi possível baixar o alvará.');
    }
  };

  // Mostrar confirmação para ações críticas
  const handleStatusAction = (partner, newStatus) => {
    setConfirmPartner(partner);
    setConfirmAction(newStatus);
    setShowConfirmDialog(true);
  };

  // Executar ação após confirmação
  const handleUpdateStatus = async () => {
    if (!confirmPartner || !confirmAction) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [confirmPartner.id]: `updating-${confirmAction}` }));
      
      await adminService.updatePartnerStatus(confirmPartner.id, confirmAction);
      
      await Promise.all([
        fetchPartners(),
        fetchStats()
      ]);
      
      // Determinar se é reativação ou primeira aprovação baseado no status anterior
      const isReactivation = confirmAction === 'active' && 
        (confirmPartner.status === 'inactive' || confirmPartner.status === 'rejected');
      
      const statusMessages = {
        'active': isReactivation 
          ? 'Parceiro reativado com sucesso! Email de reativação enviado.'
          : 'Parceiro aprovado com sucesso! Email de aprovação enviado.',
        'rejected': 'Parceiro rejeitado com sucesso! Email de notificação enviado.',
        'inactive': 'Parceiro desativado com sucesso! Email de notificação enviado.',
        'pending_approval': 'Parceiro reativado com sucesso! Email de notificação enviado.'
      };
      
      toast.success(statusMessages[confirmAction] || 'Status do parceiro atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao atualizar status do parceiro:', error);
      toast.error(error.message || 'Erro ao atualizar status do parceiro');
    } finally {
      setActionLoading(prev => ({ ...prev, [confirmPartner.id]: false }));
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setConfirmPartner(null);
    }
  };

  // Funções para o modal de edição
  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPartner(null);
    setEditLoading(false);
  };

  // Funções auxiliares para o diálogo de confirmação
  const getConfirmTitle = () => {
    if (!confirmAction || !confirmPartner) return '';
    
    // Determinar se é reativação ou primeira aprovação baseado no status atual
    const isReactivation = confirmAction === 'active' && 
      (confirmPartner.status === 'inactive' || confirmPartner.status === 'rejected');
    
    const titles = {
      'active': isReactivation ? 'Reativar Parceiro' : 'Aprovar Parceiro',
      'rejected': 'Rejeitar Parceiro',
      'inactive': 'Desativar Parceiro',
      'pending_approval': 'Reativar Parceiro'
    };
    
    return titles[confirmAction] || 'Confirmar Ação';
  };

  const getConfirmDescription = () => {
    if (!confirmAction || !confirmPartner) return '';
    
    // Determinar se é reativação ou primeira aprovação baseado no status atual
    const isReactivation = confirmAction === 'active' && 
      (confirmPartner.status === 'inactive' || confirmPartner.status === 'rejected');
    
    const descriptions = {
      'active': isReactivation 
        ? `Tem a certeza que deseja reativar o parceiro "${confirmPartner.name}"? Esta ação irá reativar a conta e enviar email de reativação.`
        : `Tem a certeza que deseja aprovar o parceiro "${confirmPartner.name}"? Esta ação irá ativar a conta e enviar email de aprovação.`,
      'rejected': `Tem a certeza que deseja rejeitar o parceiro "${confirmPartner.name}"? Esta ação irá rejeitar a conta e enviar notificação por email.`,
      'inactive': `Tem a certeza que deseja desativar o parceiro "${confirmPartner.name}"? Esta ação irá desativar a conta temporariamente e enviar notificação por email.`,
      'pending_approval': `Tem a certeza que deseja reativar o parceiro "${confirmPartner.name}"? Esta ação irá colocar a conta em estado pendente para nova aprovação.`
    };
    
    return descriptions[confirmAction] || 'Tem a certeza que deseja continuar?';
  };

  const getConfirmButtonText = () => {
    if (!confirmAction) return 'Confirmar';
    
    // Determinar se é reativação ou primeira aprovação baseado no status atual
    const isReactivation = confirmAction === 'active' && 
      (confirmPartner.status === 'inactive' || confirmPartner.status === 'rejected');
    
    const buttonTexts = {
      'active': isReactivation ? 'Reativar' : 'Aprovar',
      'rejected': 'Rejeitar',
      'inactive': 'Desativar',
      'pending_approval': 'Reativar'
    };
    
    return buttonTexts[confirmAction] || 'Confirmar';
  };

  const getConfirmType = () => {
    if (!confirmAction) return 'warning';
    
    const types = {
      'active': 'info',
      'rejected': 'danger',
      'inactive': 'warning',
      'pending_approval': 'info'
    };
    
    return types[confirmAction] || 'warning';
  };

  console.log(`[PartnerManager] A passar parceiros para a lista com status '${currentStatus}':`, partners);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          Gestão de Parceiros
        </h3>
        
        {/* Headless UI Tabs */}
        <TabGroup selectedIndex={selectedTabIndex} onChange={handleTabChange}>
          <TabList className="flex space-x-1 bg-gray-100 rounded-lg p-2">
            <Tab
              className={({ selected }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none  focus:ring-offset-2 ${
                  selected
                    ? 'bg-white my-stroke-red text-gray-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {statsLoading ? <Skeleton width={100} height={20} /> : `Pendentes (${stats.parceiros?.pending_approval || 0})`}
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-offset-2 ${
                  selected
                    ? 'my-stroke-red bg-white text-gray-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {statsLoading ? <Skeleton width={80} height={20} /> : `Ativos (${stats.parceiros?.active || 0})`}
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-offset-2 ${
                  selected
                    ? 'my-stroke-red bg-white text-gray-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {statsLoading ? <Skeleton width={110} height={20} /> : `Rejeitados (${stats.parceiros?.rejected || 0})`}
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-offset-2 ${
                  selected
                    ? 'my-stroke-red bg-white text-gray-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {statsLoading ? <Skeleton width={120} height={20} /> : `Desativados (${stats.parceiros?.inactive || 0})`}
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <div className="px-6 py-4">
                {authLoading ? (
                  <div className="space-y-4">
                    {/* Skeleton para a lista de parceiros */}
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
                    
                    {/* Skeleton para paginação */}
                    <div className="flex justify-center mt-6">
                      <Skeleton height={40} width={200} />
                    </div>
                  </div>
                ) : (
                  <>
                    <PartnerList
                      partners={partners}
                      loading={loading}
                      error={error}
                      currentStatus={currentStatus}
                      actionLoading={actionLoading}
                      onUpdateStatus={handleStatusAction}
                      onEdit={openEditModal}
                      onViewAlvara={handleViewAlvara}
                      onRetry={fetchPartners}
                    />
                    
                    <Pagination
                      pagination={pagination}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            </TabPanel>
            <TabPanel>
              <div className="px-6 py-4">
                {authLoading ? (
                  <div className="space-y-4">
                    {/* Skeleton para a lista de parceiros */}
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
                    
                    {/* Skeleton para paginação */}
                    <div className="flex justify-center mt-6">
                      <Skeleton height={40} width={200} />
                    </div>
                  </div>
                ) : (
                  <>
                    <PartnerList
                      partners={partners}
                      loading={loading}
                      error={error}
                      currentStatus={currentStatus}
                      actionLoading={actionLoading}
                      onUpdateStatus={handleStatusAction}
                      onEdit={openEditModal}
                      onViewAlvara={handleViewAlvara}
                      onRetry={fetchPartners}
                    />
                    
                    <Pagination
                      pagination={pagination}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            </TabPanel>
            <TabPanel>
              <div className="px-6 py-4">
                {authLoading ? (
                  <div className="space-y-4">
                    {/* Skeleton para a lista de parceiros */}
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
                    
                    {/* Skeleton para paginação */}
                    <div className="flex justify-center mt-6">
                      <Skeleton height={40} width={200} />
                    </div>
                  </div>
                ) : (
                  <>
                    <PartnerList
                      partners={partners}
                      loading={loading}
                      error={error}
                      currentStatus={currentStatus}
                      actionLoading={actionLoading}
                      onUpdateStatus={handleStatusAction}
                      onEdit={openEditModal}
                      onViewAlvara={handleViewAlvara}
                      onRetry={fetchPartners}
                    />
                    
                    <Pagination
                      pagination={pagination}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            </TabPanel>
            <TabPanel>
              <div className="px-6 py-4">
                {authLoading ? (
                  <div className="space-y-4">
                    {/* Skeleton para a lista de parceiros */}
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
                    
                    {/* Skeleton para paginação */}
                    <div className="flex justify-center mt-6">
                      <Skeleton height={40} width={200} />
                    </div>
                  </div>
                ) : (
                  <>
                    <PartnerList
                      partners={partners}
                      loading={loading}
                      error={error}
                      currentStatus={currentStatus}
                      actionLoading={actionLoading}
                      onUpdateStatus={handleStatusAction}
                      onEdit={openEditModal}
                      onViewAlvara={handleViewAlvara}
                      onRetry={fetchPartners}
                    />
                    
                    <Pagination
                      pagination={pagination}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>

      {/* Modal de Edição */}
      <EditPartnerModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        partner={editingPartner}
        onSubmit={handleEditSubmit}
        loading={editLoading}
      />
      
      {/* Dialog de confirmação para ações críticas */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setConfirmAction(null);
          setConfirmPartner(null);
        }}
        onConfirm={handleUpdateStatus}
        title={getConfirmTitle()}
        description={getConfirmDescription()}
        confirmText={getConfirmButtonText()}
        cancelText="Cancelar"
        type={getConfirmType()}
      />
    </div>
  );
};

export default PartnerManager;