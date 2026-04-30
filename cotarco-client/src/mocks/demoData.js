/**
 * ============================================================
 * DEMO MOCK DATA - Dados simulados para demonstração
 * ============================================================
 * 
 * FLAG DE CONTROLO: Alterar DEMO_MODE para false para desativar.
 * Ficheiro criado para a demo do Diretor Comercial (29/04/2026).
 * 
 * PARA REMOVER: Apagar este ficheiro e reverter as alterações em
 *   - src/hooks/usePartnerStats.js
 *   - src/pages/AdminDashboard.jsx
 * ============================================================
 */

export const DEMO_MODE = true;

// ─────────────────────────────────────────────────
// ADMIN DASHBOARD MOCK DATA
// ─────────────────────────────────────────────────

export const adminDashboardStats = {
  // MetricsGrid
  sales: {
    total_revenue: 18750000,
    total_this_month: 4320000,
    average_order_value: 375000,
  },
  orders: {
    total_count: 127,
    active_count: 18,
  },

  // RevenueChart (revenue_by_month) — últimos 6 meses
  revenue_by_month: [
    { month: 'Nov',  b2b: 1800000, b2c: 420000 },
    { month: 'Dez',  b2b: 2450000, b2c: 610000 },
    { month: 'Jan',  b2b: 2100000, b2c: 530000 },
    { month: 'Fev',  b2b: 2680000, b2c: 720000 },
    { month: 'Mar',  b2b: 3150000, b2c: 840000 },
    { month: 'Abr',  b2b: 3480000, b2c: 940000 },
  ],

  // BusinessModelChart (por_tipo)
  por_tipo: {
    b2b: 34,
    b2c: 12,
  },

  // PartnerFunnelChart
  partner_funnel: {
    registered: 62,
    email_verified: 54,
    active: 46,
    with_orders: 38,
  },

  // RecentTransactionsTable (recent_orders)
  recent_orders: [
    {
      id: 'ORD-2026-0041',
      merchant_transaction_id: 'CTR-20260429-001',
      user: { name: 'Distribuidora Kuanza Sul, Lda.' },
      created_at: '2026-04-29T10:22:00Z',
      status: 'paid',
      total_amount: 1250000,
      currency: 'AOA',
    },
    {
      id: 'ORD-2026-0040',
      merchant_transaction_id: 'CTR-20260428-003',
      user: { name: 'ComércioPro Angola' },
      created_at: '2026-04-28T15:48:00Z',
      status: 'paid',
      total_amount: 890000,
      currency: 'AOA',
    },
    {
      id: 'ORD-2026-0039',
      merchant_transaction_id: 'CTR-20260428-002',
      user: { name: 'Mateus & Filhos, Lda.' },
      created_at: '2026-04-28T09:12:00Z',
      status: 'pending',
      total_amount: 2100000,
      currency: 'AOA',
    },
    {
      id: 'ORD-2026-0038',
      merchant_transaction_id: 'CTR-20260427-005',
      user: { name: 'LojaBem Importações' },
      created_at: '2026-04-27T16:35:00Z',
      status: 'paid',
      total_amount: 670000,
      currency: 'AOA',
    },
    {
      id: 'ORD-2026-0037',
      merchant_transaction_id: 'CTR-20260427-001',
      user: { name: 'SuperMarket Central' },
      created_at: '2026-04-27T08:50:00Z',
      status: 'processing',
      total_amount: 1480000,
      currency: 'AOA',
    },
    {
      id: 'ORD-2026-0036',
      merchant_transaction_id: 'CTR-20260426-002',
      user: { name: 'Armazém do Norte' },
      created_at: '2026-04-26T14:20:00Z',
      status: 'paid',
      total_amount: 3200000,
      currency: 'AOA',
    },
  ],
};

export const adminTopProducts = [
  { name: 'Telemoveis', total_sold: 2340 },
  { name: 'TVs', total_sold: 1850 },
  { name: 'Electrodomesticos', total_sold: 1620 },
  { name: 'Acessorios', total_sold: 980 },
  { name: 'Suportes', total_sold: 760 },
];


// ─────────────────────────────────────────────────
// PARTNER DASHBOARD MOCK DATA
// ─────────────────────────────────────────────────

export const partnerStats = {
  // PartnerMetricsGrid
  spent_this_month: 3850000,
  delta_percentage: 12.4,
  orders_this_month: {
    total: 14,
    paid: 11,
    pending: 2,
    failed: 1,
  },
  discount_percentage: 8,
  business_model: 'B2B',

  // SpendingChart (monthly_spending) — últimos 6 meses
  monthly_spending: [
    { month: 'Nov', total: 1950000, order_count: 6 },
    { month: 'Dez', total: 2400000, order_count: 8 },
    { month: 'Jan', total: 2850000, order_count: 9 },
    { month: 'Fev', total: 3100000, order_count: 10 },
    { month: 'Mar', total: 3500000, order_count: 12 },
    { month: 'Abr', total: 3850000, order_count: 14 },
  ],

  // CategoryBreakdown (top_categories)
  top_categories: [
    { name: 'Telemoveis', total_qty: '340' },
    { name: 'TVs', total_qty: '215' },
    { name: 'Electrodomesticos', total_qty: '180' },
    { name: 'Acessorios', total_qty: '120' },
    { name: 'Suportes', total_qty: '85' },
  ],

  // ActivePaymentReference
  active_payment: {
    entity: '40125',
    reference_number: '900 123 456',
    amount: 1250000,
    due_date: '2026-05-06T23:59:59Z',
    order_id: 'ORD-2026-0039',
  },
};

export const partnerOrders = {
  data: [
    {
      id: 'ORD-2026-0039',
      created_at: '2026-04-28T09:12:00Z',
      status: 'pending',
      total_amount: 2100000,
      items: [
        { name: 'Galaxy S26', quantity: 50 },
        { name: 'Galaxy S26 Ultra', quantity: 30 },
      ],
    },
    {
      id: 'ORD-2026-0035',
      created_at: '2026-04-25T14:30:00Z',
      status: 'paid',
      total_amount: 1650000,
      items: [
        { name: 'TV Samsung Neo QLED 75', quantity: 200 },
        { name: 'Frigorifico', quantity: 12 },
        { name: 'Máquina de Lavar', quantity: 25 },
      ],
    },
    {
      id: 'ORD-2026-0031',
      created_at: '2026-04-21T11:05:00Z',
      status: 'paid',
      total_amount: 980000,
      items: [
        { name: 'Microondas', quantity: 24 },
      ],
    },
    {
      id: 'ORD-2026-0027',
      created_at: '2026-04-17T08:45:00Z',
      status: 'paid',
      total_amount: 3200000,
      items: [
        { name: 'Ar condicionado', quantity: 80 },
        { name: 'Aspirador', quantity: 60 },
      ],
    },
    {
      id: 'ORD-2026-0022',
      created_at: '2026-04-12T16:20:00Z',
      status: 'failed',
      total_amount: 450000,
      items: [
        { name: 'Galaxy Buds Pro 2', quantity: 10 },
      ],
    },
  ],
};
