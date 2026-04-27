import React from 'react';
import { RevenueChart } from './RevenueChart';
import { TopProductsChart } from './TopProductsChart';
import { PartnerFunnelChart } from './PartnerFunnelChart';
import { BusinessModelChart } from './BusinessModelChart';
import { RecentTransactionsTable } from './RecentTransactionsTable';

const DashboardOverview = ({ stats, topProducts, loading }) => {
  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-100 rounded-xl border border-slate-200"></div>
          <div className="h-80 bg-slate-100 rounded-xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6  rounded-xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={stats?.revenue_by_month || []} />
        </div>
        <div>
          <BusinessModelChart 
            b2b={stats?.por_tipo?.b2b || 0} 
            b2c={stats?.por_tipo?.b2c || 0} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PartnerFunnelChart funnelData={stats?.partner_funnel || {}} />
        <TopProductsChart products={topProducts || []} />
      </div>

      <RecentTransactionsTable orders={stats?.recent_orders || []} />
    </div>
  );
};

export default DashboardOverview;
