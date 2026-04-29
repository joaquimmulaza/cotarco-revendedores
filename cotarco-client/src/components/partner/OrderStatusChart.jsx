import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const OrderStatusChart = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <Skeleton height={24} width={150} className="mb-6" />
        <Skeleton height={250} circle width={250} className="mx-auto" />
      </div>
    );
  }

  const { orders_this_month } = stats;

  if (orders_this_month.total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Estado das encomendas</h3>
        <div className="flex items-center justify-center h-[250px] text-slate-500">
          Sem encomendas este mês
        </div>
      </div>
    );
  }

  const data = {
    labels: ['Pagas', 'Pendentes', 'Falhadas'],
    datasets: [
      {
        data: [
          orders_this_month.paid || 0,
          orders_this_month.pending || 0,
          orders_this_month.failed || 0,
        ],
        backgroundColor: [
          '#10b981', // green
          '#f59e0b', // yellow
          '#ef4444', // red
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Estado das encomendas</h3>
      <div className="h-[250px] relative">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
          <div className="text-center">
            <span className="block text-3xl font-bold text-slate-800">{orders_this_month.total}</span>
            <span className="text-xs text-slate-500">Total</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusChart;
