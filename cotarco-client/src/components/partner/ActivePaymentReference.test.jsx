import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivePaymentReference from './ActivePaymentReference';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

describe('ActivePaymentReference', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
  });

  const mockStats = {
    active_payment: {
      entity: '12345',
      reference_number: '987654321',
      amount: 50000,
      due_date: '2026-05-01'
    }
  };

  it('Quando active_payment é null: renderiza mensagem "Sem referências activas"', () => {
    render(<ActivePaymentReference stats={{ active_payment: null }} isLoading={false} />);
    expect(screen.getByText('Sem referências activas')).toBeInTheDocument();
  });

  it('Quando active_payment existe: exibe entity, reference_number, amount e due_date', () => {
    render(<ActivePaymentReference stats={mockStats} isLoading={false} />);
    expect(screen.getByTestId('payment-entity')).toHaveTextContent('12345');
    expect(screen.getByTestId('payment-reference')).toHaveTextContent('987654321');
    expect(screen.getByText(/50.000,00 Kz/)).toBeInTheDocument();
  });

  it('O botão "Copiar entidade" chama navigator.clipboard.writeText', async () => {
    render(<ActivePaymentReference stats={mockStats} isLoading={false} />);
    const copyEntityBtn = screen.getByText('Copiar entidade');
    fireEvent.click(copyEntityBtn);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('12345');
    });
  });

  it('O botão "Copiar referência" chama navigator.clipboard.writeText', async () => {
    render(<ActivePaymentReference stats={mockStats} isLoading={false} />);
    const copyRefBtn = screen.getByText('Copiar referência');
    fireEvent.click(copyRefBtn);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('987654321');
    });
  });

  it('Renderiza skeleton quando isLoading=true', () => {
    const { container } = render(<ActivePaymentReference stats={null} isLoading={true} />);
    expect(container.querySelector('.react-loading-skeleton')).toBeInTheDocument();
  });
});
