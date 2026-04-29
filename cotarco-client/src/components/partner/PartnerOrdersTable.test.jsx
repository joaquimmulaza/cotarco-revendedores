import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PartnerOrdersTable from './PartnerOrdersTable';
import * as hooks from '../../hooks/usePartnerStats';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../hooks/usePartnerStats', () => ({
  usePartnerOrders: vi.fn()
}));

describe('PartnerOrdersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renderiza skeleton quando isLoading=true', () => {
    hooks.usePartnerOrders.mockReturnValue({ data: null, isLoading: true });
    const { container } = render(<PartnerOrdersTable />);
    expect(container.querySelectorAll('.react-loading-skeleton').length).toBeGreaterThan(0);
  });

  it('Renderiza "Nenhuma encomenda encontrada" quando data=[]', () => {
    hooks.usePartnerOrders.mockReturnValue({ data: { data: [] }, isLoading: false });
    render(<PartnerOrdersTable />);
    expect(screen.getByText('Nenhuma encomenda encontrada.')).toBeInTheDocument();
  });

  it('Renderiza tabela com as colunas corretas e dados', () => {
    hooks.usePartnerOrders.mockReturnValue({
      data: {
        data: [
          {
            id: 'ord123456',
            created_at: '2026-04-26T10:00:00Z',
            total_amount: 10000,
            status: 'paid',
            items: [{ name: 'Prod A', quantity: 2 }]
          },
          {
            id: 'ord987654',
            created_at: '2026-04-25T10:00:00Z',
            total_amount: 20000,
            status: 'pending',
            items: [{ name: 'Prod B', quantity: 1 }]
          }
        ]
      },
      isLoading: false
    });

    render(<PartnerOrdersTable />);
    const rows = screen.getAllByTestId('partner-order-row');
    expect(rows).toHaveLength(2);

    expect(screen.getByText('#ord1234')).toBeInTheDocument(); // id
    expect(screen.getByText('Prod A')).toBeInTheDocument(); // items
    expect(screen.getByText('× 2')).toBeInTheDocument();
    expect(screen.getByText(/10.000,00 Kz/)).toBeInTheDocument(); // amount

    const paidBadge = screen.getByText('Pago');
    expect(paidBadge).toBeInTheDocument();

    const pendingBadge = screen.getByText('Pendente');
    expect(pendingBadge).toBeInTheDocument();
  });

  it('Clique numa linha navega para /orders/:id', () => {
    hooks.usePartnerOrders.mockReturnValue({
      data: {
        data: [
          { id: 'abc', created_at: '2026-04-26T10:00:00Z', total_amount: 10000, status: 'failed', items: [] }
        ]
      },
      isLoading: false
    });

    render(<PartnerOrdersTable />);
    const row = screen.getByTestId('partner-order-row');
    fireEvent.click(row);
    expect(mockNavigate).toHaveBeenCalledWith('/orders/abc');
  });
});
