import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ShoppingBag, TrendingUp, DollarSign, Percent, Briefcase } from 'lucide-react';

const PartnerMetricsGrid = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <Skeleton height={24} width={100} className="mb-4" />
            <Skeleton height={40} width={150} />
          </div>
        ))}
      </div>
    );
  }

  const { spent_this_month, delta_percentage, orders_this_month, discount_percentage, business_model } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Gasto */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="partner-metric-card">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total gasto (este mês)</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(spent_this_month)}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        {delta_percentage !== null && (
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium flex items-center ${delta_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {delta_percentage >= 0 ? '↑' : '↓'} {Math.abs(delta_percentage)}%
            </span>
            <span className="text-slate-500 ml-2">vs mês anterior</span>
          </div>
        )}
      </div>

      {/* Encomendas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="partner-metric-card">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Encomendas</p>
            <h3 className="text-2xl font-bold text-slate-900">{orders_this_month.total}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          <span className="font-medium text-green-600">{orders_this_month.paid} pagas</span> este mês
        </div>
      </div>

      {/* Desconto Actual */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="partner-metric-card">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Desconto</p>
            <h3 className="text-2xl font-bold text-slate-900">{discount_percentage}%</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Percent className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          Aplicado em todas as compras
        </div>
      </div>

      {/* Modelo de Negócio */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="partner-metric-card">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Modelo</p>
            <h3 className="text-2xl font-bold text-slate-900">{business_model || 'B2C'}</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          Perfil da sua conta
        </div>
      </div>
    </div>
  );
};

export default PartnerMetricsGrid;
