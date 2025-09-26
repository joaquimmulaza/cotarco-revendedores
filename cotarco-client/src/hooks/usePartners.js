import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook customizado para gerenciar dados de parceiros
 * @param {string} status - Status dos parceiros a buscar
 * @param {number} page - Página atual para paginação
 * @param {boolean} isAdmin - Se o usuário é admin
 * @param {boolean} authLoading - Se a autenticação está carregando
 * @returns {Object} { partners, pagination, loading, error, refetch }
 */
export const usePartners = ({ status, page, searchTerm }) => {
  return useQuery({
    queryKey: ['partners', { status, page, searchTerm }],
    queryFn: async () => {
      const params = {
        page: page ?? 1,
        per_page: 15,
      };
      if (status) params.status = status;
      if (searchTerm && String(searchTerm).trim() !== '') params.search = searchTerm;
      const response = await api.get('/admin/partners', { params });

      const payload = response.data;
      // Backend retorna { partners: [...], pagination: { current_page, last_page, per_page, total } }
      // A UI espera um formato tipo paginator do Laravel: { data: [...], current_page, last_page, per_page, total }
      if (payload && payload.partners && payload.pagination) {
        return {
          data: payload.partners,
          ...payload.pagination,
        };
      }

      // Fallback para manter compatibilidade caso o backend já esteja no formato esperado
      return payload;
    },
    keepPreviousData: true,
  });
};