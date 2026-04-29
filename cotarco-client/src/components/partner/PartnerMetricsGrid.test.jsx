import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PartnerMetricsGrid from './PartnerMetricsGrid';

describe('PartnerMetricsGrid', () => {
  const mockStats = {
    spent_this_month: 2100000,
    spent_last_month: 1780000,
    delta_percentage: 18.0,
    orders_this_month: { paid: 6, pending: 2, failed: 1, total: 9 },
    discount_percentage: 8,
    business_model: 'B2B',
  };

  it('Renderiza exactamente 4 cards de métricas com data-testid="partner-metric-card"', () => {
    render(<PartnerMetricsGrid stats={mockStats} isLoading={false} />);
    const cards = screen.getAllByTestId('partner-metric-card');
    expect(cards).toHaveLength(4);
  });

  it('Card "Total gasto" exibe o valor em Kz quando spent_this_month > 0', () => {
    render(<PartnerMetricsGrid stats={mockStats} isLoading={false} />);
    // Verifica se há algo com formato Kz e número
    expect(screen.getByText(/2.100.000,00 Kz/)).toBeInTheDocument();
  });

  it('Card "Encomendas" exibe o total de encomendas do mês', () => {
    render(<PartnerMetricsGrid stats={mockStats} isLoading={false} />);
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText(/6 pagas/)).toBeInTheDocument();
  });

  it('Card "Desconto" exibe a percentagem com símbolo "%"', () => {
    render(<PartnerMetricsGrid stats={mockStats} isLoading={false} />);
    expect(screen.getByText('8%')).toBeInTheDocument();
  });

  it('Card "Modelo" exibe "B2B" ou "B2C"', () => {
    render(<PartnerMetricsGrid stats={mockStats} isLoading={false} />);
    expect(screen.getByText('B2B')).toBeInTheDocument();
  });

  it('Quando isLoading=true todos os cards exibem skeleton', () => {
    const { container } = render(<PartnerMetricsGrid stats={null} isLoading={true} />);
    // Assumindo que o Skeleton de react-loading-skeleton renderiza um span com react-loading-skeleton
    expect(container.querySelectorAll('.react-loading-skeleton').length).toBeGreaterThan(0);
  });

  it('Delta positivo exibe "↑" e cor verde', () => {
    render(<PartnerMetricsGrid stats={mockStats} isLoading={false} />);
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/↑/).closest('span')).toHaveClass('text-green-600');
  });

  it('Delta negativo exibe "↓" e cor vermelha', () => {
    const negStats = { ...mockStats, delta_percentage: -5 };
    render(<PartnerMetricsGrid stats={negStats} isLoading={false} />);
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/↓/).closest('span')).toHaveClass('text-red-600');
  });

  it('Delta null não renderiza o indicador de delta', () => {
    const nullStats = { ...mockStats, delta_percentage: null };
    render(<PartnerMetricsGrid stats={nullStats} isLoading={false} />);
    expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
    expect(screen.queryByText(/↓/)).not.toBeInTheDocument();
  });
});
