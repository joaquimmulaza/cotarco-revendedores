import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePartnerStats, usePartnerOrders } from './usePartnerStats';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn() }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePartnerStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna isLoading=true inicialmente para stats', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePartnerStats(), { wrapper: createWrapper() });
    
    expect(result.current.isLoading).toBe(true);
  });

  it('retorna os dados correctos após fetch bem-sucedido para stats', async () => {
    const mockData = { spent_this_month: 2000 };
    api.get.mockResolvedValueOnce({ data: { data: mockData } });
    
    const { result } = renderHook(() => usePartnerStats(), { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/parceiro/stats');
  });

  it('retorna erro quando a API falha (status 401 ou 500) para stats', async () => {
    const mockError = new Error('Erro');
    api.get.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => usePartnerStats(), { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    }, { timeout: 5000 });
    
    expect(result.current.error).toBe(mockError);
  });
});

describe('usePartnerOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna lista de encomendas paginada', async () => {
    const mockData = { data: [{ id: 1 }, { id: 2 }], total: 2 };
    api.get.mockResolvedValueOnce({ data: mockData });
    
    const { result } = renderHook(() => usePartnerOrders(5), { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/parceiro/orders?per_page=5');
  });
});
