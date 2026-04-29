import React from 'react';
import Skeleton from 'react-loading-skeleton';

const CategoryBreakdown = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <Skeleton height={24} width={150} className="mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <Skeleton width={100} />
                <Skeleton width={40} />
              </div>
              <Skeleton height={8} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { top_categories } = stats;

  if (!top_categories || top_categories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Categorias favoritas</h3>
        <div className="flex items-center justify-center text-slate-500 py-10">
          Sem dados de categorias
        </div>
      </div>
    );
  }

  const totalQty = top_categories.reduce((acc, cat) => acc + parseInt(cat.total_qty), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Categorias favoritas</h3>
      <div className="space-y-5">
        {top_categories.map((cat, idx) => {
          const qty = parseInt(cat.total_qty);
          const percent = totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0;
          
          return (
            <div key={idx} data-testid="category-bar">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">{cat.name}</span>
                <span className="text-slate-500">{percent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full" 
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
