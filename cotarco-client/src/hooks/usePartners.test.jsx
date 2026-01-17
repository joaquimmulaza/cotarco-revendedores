import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePartners } from './usePartners'
import api from '../services/api'

// Mock do api default
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn()
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePartners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar o estado inicial correto', () => {
    const { result } = renderHook(() => usePartners({ status: 'pending_approval', page: 1 }), {
      wrapper: createWrapper()
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(null)
  })

  it('deve atualizar o estado com sucesso quando a API retorna dados', async () => {
    const mockPartners = [
      { id: 1, name: 'João Silva', email: 'joao@teste.com', status: 'pending_approval' },
      { id: 2, name: 'Maria Santos', email: 'maria@teste.com', status: 'pending_approval' }
    ]

    const mockPagination = {
      current_page: 1,
      last_page: 2,
      per_page: 15,
      total: 25
    }

    const mockApiResponse = {
      data: {
        partners: mockPartners,
        pagination: mockPagination
      }
    }

    api.get.mockResolvedValue(mockApiResponse)

    const { result } = renderHook(() => usePartners({ status: 'pending_approval', page: 1 }), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // The hook transforms the data to { data: partners, ...pagination }
    const expectedData = {
      data: mockPartners,
      ...mockPagination
    }

    expect(result.current.data).toEqual(expectedData)
    // Check call arguments
    expect(api.get).toHaveBeenCalledWith('/admin/partners', expect.objectContaining({
      params: expect.objectContaining({ page: 1, status: 'pending_approval' })
    }))
  })

  it('deve chamar a API novamente quando os parâmetros mudarem', async () => {
    const mockApiResponse = { data: { partners: [], pagination: {} } }
    api.get.mockResolvedValue(mockApiResponse)

    const { rerender } = renderHook(
      ({ status, page }) => usePartners({ status, page }),
      {
        initialProps: { status: 'pending_approval', page: 1 },
        wrapper: createWrapper()
      }
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/partners', expect.objectContaining({
        params: expect.objectContaining({ page: 1, status: 'pending_approval' })
      }))
    })

    // Mudar para página 2
    rerender({ status: 'pending_approval', page: 2 })

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/partners', expect.objectContaining({
        params: expect.objectContaining({ page: 2, status: 'pending_approval' })
      }))
    })
  })
})
