import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopProductsChart } from './TopProductsChart';

// Mock ResizeObserver for Chart.js
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('TopProductsChart Component', () => {
  const mockData = [
    { name: 'Produto 1', total_sold: 100 },
    { name: 'Produto 2', total_sold: 80 }
  ];

  it('renders the chart container', () => {
    const { container } = render(<TopProductsChart products={mockData} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<TopProductsChart products={mockData} />);
    expect(screen.getByText('Top Produtos mais vendidos')).toBeInTheDocument();
  });
});
