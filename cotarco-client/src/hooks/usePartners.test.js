import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { usePartners } from './usePartners'
import { adminService } from '../services/api'
import toast from 'react-hot-toast'

// Mock do adminService
vi.mock('../services/api', () => ({
  adminService: {
    getPartners: vi.fn()
  }
}))

// Mock do react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn()
  }
}))

describe('usePartners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar o estado inicial correto', () => {
    const { result } = renderHook(() => usePartners('pending_approval', 1, true, false))
    
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe('')
    expect(result.current.partners).toEqual([])
    expect(result.current.pagination).toBe(null)
    expect(typeof result.current.refetch).toBe('function')
  })

  it('não deve buscar dados se o usuário não for admin', async () => {
    renderHook(() => usePartners('pending_approval', 1, false, false))
    
    await waitFor(() => {
      expect(adminService.getPartners).not.toHaveBeenCalled()
    })
  })

  it('não deve buscar dados se a autenticação estiver carregando', async () => {
    renderHook(() => usePartners('pending_approval', 1, true, true))
    
    await waitFor(() => {
      expect(adminService.getPartners).not.toHaveBeenCalled()
    })
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

    const mockResponse = {
      data: mockPartners,
      pagination: mockPagination
    }

    adminService.getPartners.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => usePartners('pending_approval', 1, true, false))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.partners).toEqual(mockPartners)
    expect(result.current.pagination).toEqual(mockPagination)
    expect(result.current.error).toBe('')
    expect(adminService.getPartners).toHaveBeenCalledWith('pending_approval', 1)
  })

  it('deve definir erro e loading false quando a API falha', async () => {
    const errorMessage = 'Erro de conexão'
    const mockError = new Error(errorMessage)
    
    adminService.getPartners.mockRejectedValue(mockError)

    const { result } = renderHook(() => usePartners('pending_approval', 1, true, false))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.partners).toEqual([])
    expect(result.current.pagination).toBe(null)
    expect(toast.error).toHaveBeenCalledWith(errorMessage)
  })

  it('deve usar mensagem de erro padrão quando não há mensagem específica', async () => {
    const mockError = new Error()
    mockError.message = undefined
    
    adminService.getPartners.mockRejectedValue(mockError)

    const { result } = renderHook(() => usePartners('pending_approval', 1, true, false))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Erro ao carregar dados')
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar dados')
  })

  it('deve chamar a API novamente quando os parâmetros mudarem', async () => {
    const mockResponse = { data: [], pagination: null }
    adminService.getPartners.mockResolvedValue(mockResponse)

    const { rerender } = renderHook(
      ({ status, page }) => usePartners(status, page, true, false),
      { initialProps: { status: 'pending_approval', page: 1 } }
    )

    await waitFor(() => {
      expect(adminService.getPartners).toHaveBeenCalledWith('pending_approval', 1)
    })

    // Mudar para página 2
    rerender({ status: 'pending_approval', page: 2 })

    await waitFor(() => {
      expect(adminService.getPartners).toHaveBeenCalledWith('pending_approval', 2)
    })

    // Mudar status
    rerender({ status: 'active', page: 2 })

    await waitFor(() => {
      expect(adminService.getPartners).toHaveBeenCalledWith('active', 2)
    })
  })

  it('deve fornecer função refetch que chama a API novamente', async () => {
    const mockResponse = { data: [], pagination: null }
    adminService.getPartners.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => usePartners('pending_approval', 1, true, false))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Limpar chamadas anteriores
    vi.clearAllMocks()

    // Chamar refetch
    result.current.refetch()

    await waitFor(() => {
      expect(adminService.getPartners).toHaveBeenCalledWith('pending_approval', 1)
    })
  })
})
