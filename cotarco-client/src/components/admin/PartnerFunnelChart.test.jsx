import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PartnerFunnelChart } from './PartnerFunnelChart';

// Mock ResizeObserver for Chart.js
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('PartnerFunnelChart Component', () => {
  const mockData = {
    registered: 100,
    email_verified: 80,
    active: 50,
    with_orders: 20
  };

  it('renders the chart container', () => {
    const { container } = render(<PartnerFunnelChart funnelData={mockData} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<PartnerFunnelChart funnelData={mockData} />);
    expect(screen.getByText('Funil de Parceiros')).toBeInTheDocument();
  });
});
