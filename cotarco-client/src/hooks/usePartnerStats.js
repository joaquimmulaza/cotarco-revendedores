import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { DEMO_MODE, partnerStats as mockStats, partnerOrders as mockOrders } from '../mocks/demoData';

export const usePartnerStats = () => {
  return useQuery({
    queryKey: ['partnerStats'],
    queryFn: async () => {
      if (DEMO_MODE) return mockStats;
      const response = await api.get('/parceiro/stats');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2,
    retry: DEMO_MODE ? 0 : 2,
  });
};

export const usePartnerOrders = (perPage = 5) => {
  return useQuery({
    queryKey: ['partnerOrders', perPage],
    queryFn: async () => {
      if (DEMO_MODE) return mockOrders;
      const response = await api.get(`/parceiro/orders?per_page=${perPage}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 1,
    retry: DEMO_MODE ? 0 : 2,
  });
};
