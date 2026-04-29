import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { CreditCard, Copy, Calendar, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const ActivePaymentReference = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <Skeleton height={24} width={150} className="mb-4" />
        <Skeleton height={100} />
      </div>
    );
  }

  const { active_payment } = stats;

  if (!active_payment) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
        <div className="flex items-center space-x-2 mb-4 text-slate-800">
          <CreditCard className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Pagamento Pendente</h3>
        </div>
        <div className="flex items-center justify-center text-slate-500 py-6">
          Sem referências activas
        </div>
      </div>
    );
  }

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copiada com sucesso!`);
    }).catch(() => {
      toast.error('Erro ao copiar.');
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-md text-white p-6 relative overflow-hidden h-full">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 opacity-90" />
          <h3 className="text-lg font-semibold">Pagamento Pendente</h3>
        </div>
        <div className="bg-white/20 text-xs px-2 py-1 rounded font-medium">
          Multicaixa
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center backdrop-blur-sm">
          <div>
            <p className="text-indigo-100 text-xs mb-1 uppercase tracking-wider">Entidade</p>
            <p className="font-mono text-xl font-medium tracking-widest" data-testid="payment-entity">
              {active_payment.entity || 'N/A'}
            </p>
          </div>
          <button 
            onClick={() => handleCopy(active_payment.entity, 'Entidade')}
            className="p-2 hover:bg-white/20 rounded-full transition-colors group relative"
            title="Copiar entidade"
          >
            <Copy className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            <span className="sr-only">Copiar entidade</span>
          </button>
        </div>

        <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center backdrop-blur-sm">
          <div>
            <p className="text-indigo-100 text-xs mb-1 uppercase tracking-wider">Referência</p>
            <p className="font-mono text-xl font-medium tracking-widest" data-testid="payment-reference">
              {active_payment.reference_number || 'N/A'}
            </p>
          </div>
          <button 
            onClick={() => handleCopy(active_payment.reference_number, 'Referência')}
            className="p-2 hover:bg-white/20 rounded-full transition-colors group relative"
            title="Copiar referência"
          >
            <Copy className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            <span className="sr-only">Copiar referência</span>
          </button>
        </div>

        <div className="flex justify-between items-end pt-2">
          <div>
            <p className="text-indigo-100 text-xs mb-1">Montante</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(active_payment.amount)}
            </p>
          </div>
          
          {active_payment.due_date && (
            <div className="text-right">
              <p className="text-indigo-100 text-xs mb-1 flex items-center justify-end">
                <Calendar className="w-3 h-3 mr-1" /> Expira a
              </p>
              <p className="text-sm font-medium">
                {new Date(active_payment.due_date).toLocaleDateString('pt-AO')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <a 
        href={`/orders/${active_payment.order_id}`}
        className="mt-4 flex items-center justify-center w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
      >
        Ver Encomenda <ExternalLink className="w-3 h-3 ml-2" />
      </a>
    </div>
  );
};

export default ActivePaymentReference;
