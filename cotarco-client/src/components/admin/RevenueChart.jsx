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

export function RevenueChart({ data = [] }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  const hasData = Array.isArray(data) && data.length > 0;

  const chartData = hasData ? {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'B2B',
        data: data.map(item => item.b2b),
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500
      },
      {
        label: 'B2C',
        data: data.map(item => item.b2c),
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // emerald-500
      },
    ],
  } : null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Receita Mensal (B2B vs B2C)</h3>
      <div className="flex-1 min-h-[300px]">
        {hasData ? (
          <Bar options={options} data={chartData} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 italic">
            Sem dados de receita para exibir
          </div>
        )}
      </div>
    </div>
  );
}
