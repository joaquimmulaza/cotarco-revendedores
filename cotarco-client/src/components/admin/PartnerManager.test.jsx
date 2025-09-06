import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PartnerManager from './PartnerManager'
import { usePartners } from '../../hooks/usePartners'
import { useAuth } from '../../contexts/AuthContext'

// Mock do hook usePartners
vi.mock('../../hooks/usePartners', () => ({
  usePartners: vi.fn()
}))

// Mock do hook useAuth
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock dos componentes filhos
vi.mock('./PartnerList', () => ({
  default: ({ partners, loading, error }) => {
    if (loading) return <div>A carregar...</div>
    if (error) return <div>Erro: {error}</div>
    return (
      <div>
        {partners.map(partner => (
          <div key={partner.id}>{partner.name}</div>
        ))}
      </div>
    )
  }
}))

vi.mock('./Pagination', () => ({
  default: () => <div>Pagination Component</div>
}))

vi.mock('./EditPartnerModal', () => ({
  default: () => <div>Edit Partner Modal</div>
}))

vi.mock('../ConfirmDialog', () => ({
  default: () => <div>Confirm Dialog</div>
}))

// Mock do react-loading-skeleton
vi.mock('react-loading-skeleton', () => ({
  default: ({ width, height }) => <div data-testid="skeleton" style={{ width, height }}>Loading...</div>
}))

// Mock do react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn()
  }
}))

describe('PartnerManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar "A carregar..." quando loading é true', () => {
    // Mock do useAuth
    useAuth.mockReturnValue({
      authLoading: false,
      isAdmin: true
    })

    // Mock do usePartners retornando loading true
    usePartners.mockReturnValue({
      partners: [],
      pagination: null,
      loading: true,
      error: '',
      refetch: vi.fn()
    })

    render(<PartnerManager />)
    
    expect(screen.getByText('A carregar...')).toBeInTheDocument()
  })

  it('deve renderizar mensagem de erro quando error existe', () => {
    // Mock do useAuth
    useAuth.mockReturnValue({
      authLoading: false,
      isAdmin: true
    })

    // Mock do usePartners retornando erro
    usePartners.mockReturnValue({
      partners: [],
      pagination: null,
      loading: false,
      error: 'Erro de teste',
      refetch: vi.fn()
    })

    render(<PartnerManager />)
    
    expect(screen.getByText('Erro: Erro de teste')).toBeInTheDocument()
  })

  it('deve renderizar lista de parceiros quando dados estão disponíveis', () => {
    // Mock do useAuth
    useAuth.mockReturnValue({
      authLoading: false,
      isAdmin: true
    })

    // Mock do usePartners retornando lista de parceiros
    const mockPartners = [
      { id: 1, name: 'João Silva', email: 'joao@teste.com', status: 'pending_approval' },
      { id: 2, name: 'Maria Santos', email: 'maria@teste.com', status: 'active' },
      { id: 3, name: 'Pedro Costa', email: 'pedro@teste.com', status: 'rejected' }
    ]

    usePartners.mockReturnValue({
      partners: mockPartners,
      pagination: { current_page: 1, last_page: 1, total: 3 },
      loading: false,
      error: '',
      refetch: vi.fn()
    })

    render(<PartnerManager />)
    
    // Verificar se os nomes dos parceiros são renderizados
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    expect(screen.getByText('Pedro Costa')).toBeInTheDocument()
  })

  it('deve renderizar skeleton quando authLoading é true', () => {
    // Mock do useAuth com authLoading true
    useAuth.mockReturnValue({
      authLoading: true,
      isAdmin: true
    })

    // Mock do usePartners (não deve ser chamado quando authLoading é true)
    usePartners.mockReturnValue({
      partners: [],
      pagination: null,
      loading: false,
      error: '',
      refetch: vi.fn()
    })

    render(<PartnerManager />)
    
    // Verificar se os skeletons são renderizados (pelo menos alguns)
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('deve renderizar tabs quando não está carregando', () => {
    // Mock do useAuth
    useAuth.mockReturnValue({
      authLoading: false,
      isAdmin: true
    })

    // Mock do usePartners
    usePartners.mockReturnValue({
      partners: [],
      pagination: null,
      loading: false,
      error: '',
      refetch: vi.fn()
    })

    render(<PartnerManager />)
    
    // Verificar se as tabs são renderizadas (mostram skeletons quando statsLoading é true)
    expect(screen.getAllByText(/Pendentes|Loading/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Ativos|Loading/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Rejeitados|Loading/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Desativados|Loading/).length).toBeGreaterThan(0)
  })

  it('deve renderizar componente de paginação quando pagination existe', () => {
    // Mock do useAuth
    useAuth.mockReturnValue({
      authLoading: false,
      isAdmin: true
    })

    // Mock do usePartners com paginação
    usePartners.mockReturnValue({
      partners: [],
      pagination: { current_page: 1, last_page: 3, total: 30 },
      loading: false,
      error: '',
      refetch: vi.fn()
    })

    render(<PartnerManager />)
    
    expect(screen.getByText('Pagination Component')).toBeInTheDocument()
  })

  it('deve chamar usePartners com parâmetros corretos', () => {
    // Mock do useAuth
    useAuth.mockReturnValue({
      authLoading: false,
      isAdmin: true
    })

    // Mock do usePartners
    usePartners.mockReturnValue({
      partners: [],
      pagination: null,
      loading: false,
      error: '',
      refetch: vi.fn()
    })

    render(<PartnerManager />)
    
    // Verificar se usePartners foi chamado com os parâmetros corretos
    expect(usePartners).toHaveBeenCalledWith(
      'pending_approval', // currentStatus (primeira tab)
      1, // currentPage
      true, // isAdmin
      false // authLoading
    )
  })
})
