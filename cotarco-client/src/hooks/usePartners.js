import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook customizado para gerenciar dados de parceiros
 * @param {string} status - Status dos parceiros a buscar
 * @param {number} page - Página atual para paginação
 * @param {boolean} isAdmin - Se o usuário é admin
 * @param {boolean} authLoading - Se a autenticação está carregando
 * @returns {Object} { partners, pagination, loading, error, refetch }
 */
export const usePartners = (status, page, isAdmin, authLoading) => {
  // Estados para gestão de dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partners, setPartners] = useState([]);
  const [pagination, setPagination] = useState(null);

  const fetchPartners = useCallback(async () => {
    // Só buscar dados se o usuário for admin e não estiver carregando
    if (!isAdmin || authLoading) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await adminService.getPartners(status, page);
      setPartners(response.data || []);
      setPagination(response.pagination || null);
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error);
      const errorMessage = error.message || 'Erro ao carregar dados';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [status, page, isAdmin, authLoading]);

  // Carregar parceiros quando os parâmetros mudarem
  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return {
    partners,
    pagination,
    loading,
    error,
    refetch: fetchPartners
  };
};
