import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import PartnerCard from './PartnerCard';

const PartnerList = ({ 
  partners, 
  loading, 
  error, 
  currentStatus,
  actionLoading,
  onUpdateStatus,
  onEdit,
  onViewAlvara,
  onRetry
}) => {
  console.log(`[PartnerList] Recebeu a prop 'partners' com status '${currentStatus}':`, partners);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton width={128} height={24} />
                    <Skeleton width={80} height={20} />
                    <Skeleton width={96} height={20} />
                  </div>
                  <Skeleton width={128} height={20} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton width={64} height={16} className="mr-2" />
                      <Skeleton width={96} height={16} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} width={80} height={32} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
        <p className="text-gray-600 mb-4">{error.message || String(error)}</p>
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {currentStatus === 'pending_approval' && 'Nenhum parceiro pendente'}
          {currentStatus === 'active' && 'Nenhum parceiro ativo'}
          {currentStatus === 'rejected' && 'Nenhum parceiro rejeitado'}
          {currentStatus === 'inactive' && 'Nenhum parceiro desativado'}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {currentStatus === 'pending_approval' && 'No momento não há revendedores ou distribuidores aguardando aprovação.'}
          {currentStatus === 'active' && 'No momento não há revendedores ou distribuidores ativos no sistema.'}
          {currentStatus === 'rejected' && 'No momento não há revendedores ou distribuidores rejeitados.'}
          {currentStatus === 'inactive' && 'No momento não há revendedores ou distribuidores que foram desativados temporariamente.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {partners.map((partner) => (
        <PartnerCard
          key={partner.id}
          partner={partner}
          actionLoading={actionLoading}
          onUpdateStatus={onUpdateStatus}
          onEdit={onEdit}
          onViewAlvara={onViewAlvara}
        />
      ))}
    </div>
  );
};

export default PartnerList;

