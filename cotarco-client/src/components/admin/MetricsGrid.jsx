import React, { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ShoppingCartIcon, BanknotesIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const MetricsGrid = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard-stats');
        setStats(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Erro ao carregar estatísticas');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl border border-gray-100"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return null; // Or show error message
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(value).replace('AOA', 'Kz');
  };

  const metrics = [
    {
      label: 'Receita Total',
      value: formatCurrency(stats?.sales?.total_revenue || 0),
      icon: BanknotesIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: stats?.sales?.total_this_month > 0 ? `+${formatCurrency(stats.sales.total_this_month)} este mês` : 'Sem vendas este mês',
    },
    {
      label: 'Total de Encomendas',
      value: stats?.orders?.total_count || 0,
      icon: ShoppingCartIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: `${stats?.orders?.active_count || 0} encomendas ativas`,
    },
    {
      label: 'Ticket Médio (AOV)',
      value: formatCurrency(stats?.sales?.average_order_value || 0),
      icon: PresentationChartLineIcon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      trend: 'Média por encomenda paga',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-testid="metrics-grid">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
        >
          {/* Glassmorphism accent */}
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#f22f1d]/5 rounded-full blur-2xl group-hover:bg-[#f22f1d]/10 transition-colors"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{metric.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 leading-none">
                {metric.value}
              </h3>
              <p className="mt-2 text-xs text-gray-400 font-medium whitespace-nowrap">
                {metric.trend}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${metric.bgColor}`}>
              <metric.icon className={`h-6 w-6 ${metric.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsGrid;
