import React from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import { usePartnerOrders } from '../../hooks/usePartnerStats';
import { Package, ChevronRight, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const PartnerOrdersTable = () => {
  const { data, isLoading } = usePartnerOrders(5);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <Skeleton height={24} width={200} />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={60} />
          ))}
        </div>
      </div>
    );
  }

  const orders = data?.data || [];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid':
      case 'success':
      case 'completed':
        return { label: 'Pago', className: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'pending':
        return { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700', icon: Clock };
      case 'failed':
      case 'cancelled':
        return { label: 'Falhado', className: 'bg-red-100 text-red-700', icon: AlertCircle };
      default:
        return { label: status, className: 'bg-slate-100 text-slate-700', icon: Package };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-testid="partner-orders-table">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Últimas Encomendas</h3>
        <button 
          onClick={() => navigate('/orders')}
          className="cursor-pointer text-sm font-medium text-indigo-500 hover:text-indigo-700 flex items-center"
        >
          Ver todas
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>Nenhuma encomenda encontrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ID / Data</th>
                <th className="px-6 py-4">Artigos</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                
                // Extrair primeiro item para resumo
                const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                const otherItemsCount = order.items ? order.items.length - 1 : 0;

                return (
                  <tr 
                    key={order.id} 
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    data-testid="partner-order-row"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        #{String(order.id).substring(0, 7)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('pt-AO')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {firstItem ? (
                        <div className="flex items-center">
                          <span className="truncate max-w-[150px] md:max-w-[250px]" title={firstItem.name}>
                            {firstItem.name}
                          </span>
                          <span className="ml-1 text-slate-400">× {firstItem.quantity}</span>
                          {otherItemsCount > 0 && (
                            <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              +{otherItemsCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
                        <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PartnerOrdersTable;
