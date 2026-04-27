import React from 'react';
export function RecentTransactionsTable({ orders = [] }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Pago</span>;
      case 'processing':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Processamento</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pendente</span>;
      case 'cancelled':
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Cancelado</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-slate-800">Transações Recentes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Referência</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {order.merchant_transaction_id || `#${String(order.id).substring(0, 8).toUpperCase()}`}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{order.user?.name || 'Cliente'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(order.created_at))}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: order.currency || 'AOA' }).format(order.total_amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  Nenhuma transação recente encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
