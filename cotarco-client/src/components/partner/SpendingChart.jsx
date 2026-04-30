import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SpendingChart = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <Skeleton height={24} width={200} className="mb-6" />
        <Skeleton height={250} />
      </div>
    );
  }

  const { monthly_spending } = stats;

  if (!monthly_spending || monthly_spending.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Histórico de gastos mensais</h3>
        <div className="h-[250px] flex items-center justify-center text-slate-500">
          Sem dados de gastos disponíveis
        </div>
      </div>
    );
  }

  const data = {
    labels: monthly_spending.map(m => m.month),
    datasets: [
      {
        label: 'Valor gasto',
        data: monthly_spending.map(m => m.total),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        label: 'Encomendas',
        data: monthly_spending.map(m => m.order_count),
        backgroundColor: '#93c5fd',
        borderRadius: 4,
        hidden: true, // Ocultar por padrão, mas manter na legenda
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            if (value >= 1000000) return (value / 1000000) + 'M Kz';
            if (value >= 1000) return (value / 1000) + 'k Kz';
            return value;
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Histórico de gastos mensais</h3>
      <div className="h-[250px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default SpendingChart;
