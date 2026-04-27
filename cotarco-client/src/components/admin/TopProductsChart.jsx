import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function TopProductsChart({ products = [] }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const hasData = Array.isArray(products) && products.length > 0;

  const chartData = hasData ? {
    labels: products.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: products.map(p => p.total_sold),
        backgroundColor: 'rgba(245, 158, 11, 0.8)', // amber-500
      },
    ],
  } : null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Produtos mais vendidos</h3>
      <div className="flex-1 min-h-[300px]">
        {hasData ? (
          <Bar options={options} data={chartData} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 italic">
            Sem dados de vendas para exibir
          </div>
        )}
      </div>
    </div>
  );
}
