import React from 'react';
import { usePartnerStats } from '../../hooks/usePartnerStats';
import PartnerMetricsGrid from './PartnerMetricsGrid';
import SpendingChart from './SpendingChart';
import OrderStatusChart from './OrderStatusChart';
import CategoryBreakdown from './CategoryBreakdown';
import ActivePaymentReference from './ActivePaymentReference';
import PartnerOrdersTable from './PartnerOrdersTable';

const PartnerDashboardOverview = () => {
  const { data: stats, isLoading, isError, error } = usePartnerStats();

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-2">Erro ao carregar dados</h3>
        <p>{error?.message || 'Ocorreu um erro ao carregar as estatísticas do dashboard.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Grid */}
      <PartnerMetricsGrid stats={stats} isLoading={isLoading} />

      {/* Middle Row: Charts & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingChart stats={stats} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <ActivePaymentReference stats={stats} isLoading={isLoading} />
        </div>
      </div>

      {/* Bottom Row: Status & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderStatusChart stats={stats} isLoading={isLoading} />
        <CategoryBreakdown stats={stats} isLoading={isLoading} />
      </div>

      {/* Full Width Table at the bottom */}
      <PartnerOrdersTable />
    </div>
  );
};

export default PartnerDashboardOverview;
