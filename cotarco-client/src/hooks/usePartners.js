import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/api';

/**
 * Hook customizado para gerenciar dados de parceiros
 * @param {string} status - Status dos parceiros a buscar
 * @param {number} page - Página atual para paginação
 * @param {boolean} isAdmin - Se o usuário é admin
 * @param {boolean} authLoading - Se a autenticação está carregando
 * @returns {Object} { partners, pagination, loading, error, refetch }
 */
export const usePartners = (status, page, isAdmin, authLoading) => {
  return useQuery({
    queryKey: ['partners', status, page, isAdmin, authLoading],
    queryFn: async () => {
      const response = await adminService.getPartners(status, page);
      return response;
    },
    enabled: !!isAdmin && !authLoading,
    keepPreviousData: true,
  });
};