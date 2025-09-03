import React, { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import toast from 'react-hot-toast';
import PartnerList from './PartnerList';
import Pagination from './Pagination';
import EditPartnerModal from './EditPartnerModal';

const PartnerManager = () => {
  const { authLoading, isAdmin } = useAuth();
  
  // Estados para gestão de dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partners, setPartners] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  
  // Estados para navegação e paginação
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  // Estados para o modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  
  // Mapear índices de tabs para status
  const tabStatusMap = ['pending_approval', 'active', 'rejected', 'inactive'];
  const currentStatus = tabStatusMap[selectedTabIndex];
  
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

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getRevendedores(currentStatus, currentPage);
      setPartners(response.data || []);
      setPagination(response.pagination || null);
      
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

  // Carregar parceiros
  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchPartners();
    }
  }, [fetchPartners, authLoading, isAdmin]);

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

  const handleTabChange = (index) => {
    setSelectedTabIndex(index);
    setCurrentPage(1);
    
    if (!authLoading && isAdmin) {
      fetchStats();
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

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: `updating-${newStatus}` }));
      
      await adminService.updateRevendedorStatus(userId, newStatus);
      
      await Promise.all([
        fetchPartners(),
        fetchStats()
      ]);
      
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
    setEditingPartner(partner);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPartner(null);
    setEditLoading(false);
  };

  return (
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
        <PartnerList
          partners={partners}
          loading={loading}
          error={error}
          currentStatus={currentStatus}
          actionLoading={actionLoading}
          onUpdateStatus={handleUpdateStatus}
          onEdit={openEditModal}
          onViewAlvara={handleViewAlvara}
          onRetry={fetchPartners}
        />
        
        <Pagination
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal de Edição */}
      <EditPartnerModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        partner={editingPartner}
        onSubmit={handleEditSubmit}
        loading={editLoading}
      />
    </div>
  );
};

export default PartnerManager;
