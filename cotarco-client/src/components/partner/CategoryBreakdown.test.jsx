import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CategoryBreakdown from './CategoryBreakdown';

describe('CategoryBreakdown', () => {
  const mockStats = {
    top_categories: [
      { name: 'Telemóveis', total_qty: 44 },
      { name: 'Televisões', total_qty: 28 },
      { name: 'Tablets', total_qty: 15 },
    ]
  };

  it('Renderiza uma barra de progresso por categoria com data-testid="category-bar"', () => {
    render(<CategoryBreakdown stats={mockStats} isLoading={false} />);
    const bars = screen.getAllByTestId('category-bar');
    expect(bars).toHaveLength(3);
  });

  it('Cada barra exibe o nome da categoria e a percentagem', () => {
    render(<CategoryBreakdown stats={mockStats} isLoading={false} />);
    expect(screen.getByText('Telemóveis')).toBeInTheDocument();
    // 44 + 28 + 15 = 87
    // Telemóveis: round(44/87 * 100) = 51%
    expect(screen.getByText('51%')).toBeInTheDocument();
  });

  it('Quando top_categories=[] exibe "Sem dados de categorias"', () => {
    render(<CategoryBreakdown stats={{ top_categories: [] }} isLoading={false} />);
    expect(screen.getByText('Sem dados de categorias')).toBeInTheDocument();
  });

  it('Renderiza skeleton quando isLoading=true', () => {
    const { container } = render(<CategoryBreakdown stats={null} isLoading={true} />);
    expect(container.querySelectorAll('.react-loading-skeleton').length).toBeGreaterThan(0);
  });
});
