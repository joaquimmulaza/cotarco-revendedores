import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueChart } from './RevenueChart';

// Mock ResizeObserver for Chart.js
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('RevenueChart Component', () => {
  const mockData = [
    { month: '2023-01', b2b: 1000, b2c: 500 },
    { month: '2023-02', b2b: 1200, b2c: 600 }
  ];

  it('renders the chart container', () => {
    const { container } = render(<RevenueChart data={mockData} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<RevenueChart data={mockData} />);
    expect(screen.getByText('Receita Mensal (B2B vs B2C)')).toBeInTheDocument();
  });
});
