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

export function PartnerFunnelChart({ funnelData = {} }) {
  const labels = ['Registados', 'Email Verificado', 'Aprovados', 'Com Encomendas'];
  
  const data = [
    funnelData.registered || 0,
    funnelData.email_verified || 0,
    funnelData.active || 0,
    funnelData.with_orders || 0,
  ];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Parceiros',
        data,
        backgroundColor: [
          'rgba(148, 163, 184, 0.8)', // slate-400
          'rgba(96, 165, 250, 0.8)',  // blue-400
          'rgba(52, 211, 153, 0.8)',  // emerald-400
          'rgba(251, 191, 36, 0.8)',  // amber-400
        ],
      },
    ],
  };

  const options = {
    indexAxis: 'y', // Horizontal bar chart to look like a funnel
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Funil de Parceiros</h3>
      <div className="flex-1 min-h-[300px]">
        {Object.keys(funnelData).length > 0 ? (
          <Bar options={options} data={chartData} />
        ) : (
           <div className="flex items-center justify-center h-full text-slate-500">
             A carregar dados...
           </div>
        )}
      </div>
    </div>
  );
}
