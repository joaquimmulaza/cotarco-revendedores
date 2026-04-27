import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export function BusinessModelChart({ b2b = 0, b2c = 0 }) {
  const chartData = {
    labels: ['B2B', 'B2C'],
    datasets: [
      {
        data: [b2b, b2c],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue-500
          'rgba(99, 102, 241, 0.8)', // indigo-500
        ],
        borderColor: [
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    cutout: '70%',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição de Parceiros</h3>
      <div className="flex-1 min-h-[250px] relative">
        <Doughnut options={options} data={chartData} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
          <span className="text-3xl font-bold text-slate-700">
            {b2b + b2c}
          </span>
        </div>
      </div>
    </div>
  );
}
