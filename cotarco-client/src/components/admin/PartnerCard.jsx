import React from 'react';

// Sub-componente para renderizar os botões de ação
const RenderActionButtons = ({ 
  partner, 
  actionLoading, 
  onUpdateStatus, 
  onEdit, 
  onViewAlvara 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-6">
      {/* Botão Editar */}
      <button
        onClick={() => onEdit(partner)}
        className="cursor-pointer bg-gray-100 my-text-gray px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors text-xs font-medium flex items-center justify-center"
      >
        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Editar
      </button>

      {/* Botão Ver Alvará */}
      {partner.partner_profile?.alvara_path ? (
        <button
          onClick={() => onViewAlvara(partner.id)}
          className="cursor-pointer bg-gray-100 my-text-gray my-text-red px-3 py-1.5 rounded-md  hover:bg-gray-300 transition-colors text-xs font-medium flex items-center justify-center"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Ver Alvará
        </button>
      ) : (
        <div className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center">
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Sem Alvará
        </div>
      )}
      
      {/* Botões de ação baseados no status atual */}
      {partner.status === 'pending_approval' && (
        <>
          <button
            onClick={() => onUpdateStatus(partner, 'active')}
            disabled={actionLoading[partner.id]}
            className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center justify-center"
          >
            {actionLoading[partner.id] === 'updating-active' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                A aprovar...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aprovar
              </>
            )}
          </button>
          
          <button
            onClick={() => onUpdateStatus(partner, 'rejected')}
            disabled={actionLoading[partner.id]}
            className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center justify-center"
          >
            {actionLoading[partner.id] === 'updating-rejected' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                A rejeitar...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rejeitar
              </>
            )}
          </button>
        </>
      )}
      
      {partner.status === 'active' && (
        <button
          onClick={() => onUpdateStatus(partner, 'inactive')}
          disabled={actionLoading[partner.id]}
          className="cursor-pointer my-stroke-red my-text-red px-3 py-1.5 rounded-md hover-color disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center justify-center"
        >
          {actionLoading[partner.id] === 'updating-inactive' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red mr-2"></div>
              A desativar...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
              Desativar
            </>
          )}
        </button>
      )}

      {partner.status === 'inactive' && (
        <button
          onClick={() => onUpdateStatus(partner, 'active')}
          disabled={actionLoading[partner.id]}
          className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center justify-center"
        >
          {actionLoading[partner.id] === 'updating-active' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              A reativar...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reativar
            </>
          )}
        </button>
      )}
      
      {partner.status === 'rejected' && (
        <button
          onClick={() => onUpdateStatus(partner, 'pending_approval')}
          disabled={actionLoading[partner.id]}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center justify-center"
        >
          {actionLoading[partner.id] === 'updating-pending_approval' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              A reativar...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reativar
            </>
          )}
        </button>
      )}
    </div>
  );
};

const PartnerCard = ({ 
  partner, 
  actionLoading, 
  onUpdateStatus, 
  onEdit, 
  onViewAlvara 
}) => {
  const formatDate = (dateString) => {
    console.log('Data recebida para formatação:', dateString);
    if (!dateString) return 'Data não disponível';
    try {
      const date = new Date(dateString);
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.log('Data inválida detectada:', dateString);
        return 'Data inválida';
      }
      const formatted = date.toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      console.log('Data formatada:', formatted);
      return formatted;
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data original:', dateString);
      return 'Data inválida';
    }
  };
  
  const formatBusinessModel = (businessModel) => {
    if (!businessModel) return 'Não definido';
    return businessModel;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h4 className="text-xl font-semibold text-gray-900">
              {partner.name}
            </h4>
            {/* Status Badge */}
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              partner.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
              partner.status === 'active' ? 'bg-green-50 text-green-800' :
              partner.status === 'rejected' ? 'bg-red-100 text-red-800' :
              partner.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {partner.status === 'pending_approval' ? 'Pendente' :
               partner.status === 'active' ? 'Ativo' :
               partner.status === 'rejected' ? 'Rejeitado' :
               partner.status === 'inactive' ? 'Desativado' :
               partner.status}
            </span>
            
            {/* Role Badge */}
            {partner.role ? (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                partner.role === 'revendedor' ? 'bg-tags' :
                partner.role === 'distribuidor' ? 'bg-tags' :
                'bg-gray-100 text-gray-800'
              }`}>
                {partner.role === 'revendedor' ? 'Revendedor' :
                 partner.role === 'distribuidor' ? 'Distribuidor' :
                 partner.role}
              </span>
            ) : (
              <span className="bg-yellow-200 text-yellow-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">
                A classificar
              </span>
            )}
            
          </div>
          <span className="text-sm text-gray-500 ">
              Registado em {formatDate(partner.created_at)}
            </span>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-6 gap-x-26 text-sm">
            <div className="flex items-start space-x-3">
              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Email:</span>
              <span className="text-gray-600 break-all">{partner.email}</span>
            </div>
            
            <div className="flex items-start space-x-3">
            
              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Empresa:</span>
              <span className="text-gray-600">{partner.partner_profile?.company_name || 'N/A'}</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Telefone:</span>
              <span className="text-gray-600">{partner.partner_profile?.phone_number || 'N/A'}</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Modelo:</span>
              <span className="text-gray-600">{formatBusinessModel(partner.partner_profile?.business_model)}</span>
            </div>
          </div>
          
          <RenderActionButtons 
            partner={partner}
            actionLoading={actionLoading}
            onUpdateStatus={onUpdateStatus}
            onEdit={onEdit}
            onViewAlvara={onViewAlvara}
          />
        </div>
      </div>
    </div>
  );
};

export default PartnerCard;

