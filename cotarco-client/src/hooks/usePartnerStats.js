import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const usePartnerStats = () => {
  return useQuery({
    queryKey: ['partnerStats'],
    queryFn: async () => {
      const response = await api.get('/parceiro/stats');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });
};

export const usePartnerOrders = (perPage = 5) => {
  return useQuery({
    queryKey: ['partnerOrders', perPage],
    queryFn: async () => {
      const response = await api.get(`/parceiro/orders?per_page=${perPage}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 1,
    retry: 2,
  });
};
