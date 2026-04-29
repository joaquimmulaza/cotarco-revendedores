import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrderStatusChart from './OrderStatusChart';

vi.mock('react-chartjs-2', () => ({
  Doughnut: ({ data }) => (
    <div data-testid="status-chart">
      {data?.labels?.map((l, i) => <span key={i}>{l}</span>)}
    </div>
  )
}));

describe('OrderStatusChart', () => {
  const mockStats = {
    orders_this_month: { paid: 5, pending: 2, failed: 1 }
  };

  it('Renderiza o gráfico de donut quando recebe orders_this_month com dados', () => {
    render(<OrderStatusChart stats={mockStats} isLoading={false} />);
    expect(screen.getByTestId('status-chart')).toBeInTheDocument();
  });

  it('Exibe os labels "Pagas", "Pendentes", "Falhadas"', () => {
    render(<OrderStatusChart stats={mockStats} isLoading={false} />);
    expect(screen.getByText('Pagas')).toBeInTheDocument();
    expect(screen.getByText('Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Falhadas')).toBeInTheDocument();
  });

  it('Renderiza skeleton quando isLoading=true', () => {
    const { container } = render(<OrderStatusChart stats={null} isLoading={true} />);
    expect(container.querySelector('.react-loading-skeleton')).toBeInTheDocument();
  });

  it('Quando todos os valores são 0: exibe "Sem encomendas este mês"', () => {
    const emptyStats = { orders_this_month: { paid: 0, pending: 0, failed: 0, total: 0 } };
    render(<OrderStatusChart stats={emptyStats} isLoading={false} />);
    expect(screen.getByText('Sem encomendas este mês')).toBeInTheDocument();
  });
});
