import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentTransactionsTable } from './RecentTransactionsTable';

describe('RecentTransactionsTable Component', () => {
  const mockOrders = [
    {
      id: 1,
      user: { name: 'João Silva' },
      created_at: '2023-10-01T10:00:00.000Z',
      status: 'paid',
      total_amount: 150.50
    }
  ];

  it('renders the table header', () => {
    render(<RecentTransactionsTable orders={[]} />);
    expect(screen.getByText('Transações Recentes')).toBeInTheDocument();
  });

  it('renders order data correctly', () => {
    render(<RecentTransactionsTable orders={mockOrders} />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    // Currency formatting might vary by environment, check basic output
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });
});
