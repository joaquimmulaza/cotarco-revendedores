import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BusinessModelChart } from './BusinessModelChart';

// Mock ResizeObserver for Chart.js
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('BusinessModelChart Component', () => {
  it('renders the chart container', () => {
    const { container } = render(<BusinessModelChart b2b={10} b2c={5} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<BusinessModelChart b2b={10} b2c={5} />);
    expect(screen.getByText('Distribuição de Parceiros')).toBeInTheDocument();
  });
});
