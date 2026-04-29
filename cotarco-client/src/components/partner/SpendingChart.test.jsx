import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpendingChart from './SpendingChart';

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data }) => (
    <div data-testid="spending-chart">
      {data?.labels?.map((l, i) => <span key={i}>{l}</span>)}
      {data?.datasets?.map((d, i) => <span key={`d-${i}`}>{d.label}</span>)}
    </div>
  )
}));

describe('SpendingChart', () => {
  const mockStats = {
    monthly_spending: [
      { month: '2025-10', total: 1000, order_count: 5 },
      { month: '2025-11', total: 2000, order_count: 10 }
    ]
  };

  it('Renderiza o mock do gráfico quando recebe monthly_spending com dados', () => {
    render(<SpendingChart stats={mockStats} isLoading={false} />);
    expect(screen.getByTestId('spending-chart')).toBeInTheDocument();
  });

  it('Renderiza skeleton quando isLoading=true', () => {
    const { container } = render(<SpendingChart stats={null} isLoading={true} />);
    expect(container.querySelector('.react-loading-skeleton')).toBeInTheDocument();
  });

  it('Renderiza "Sem dados de gastos" quando monthly_spending=[] ou null', () => {
    render(<SpendingChart stats={{ monthly_spending: [] }} isLoading={false} />);
    expect(screen.getByText('Sem dados de gastos disponíveis')).toBeInTheDocument();
  });

  it('O título "Histórico de gastos" está presente', () => {
    render(<SpendingChart stats={mockStats} isLoading={false} />);
    expect(screen.getByText(/Histórico de gastos mensais/)).toBeInTheDocument();
  });

  it('A legenda exibe "Valor gasto" e "Encomendas"', () => {
    render(<SpendingChart stats={mockStats} isLoading={false} />);
    expect(screen.getByText('Valor gasto')).toBeInTheDocument();
    expect(screen.getByText('Encomendas')).toBeInTheDocument();
  });
});
