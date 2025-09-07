import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';

const EditPartnerModal = ({ 
  isOpen, 
  onClose, 
  partner, 
  onSubmit, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    role: '',
    business_model: ''
  });

  // Atualizar formData quando o partner mudar
  useEffect(() => {
    if (partner) {
      setFormData({
        role: partner.role || '',
        business_model: partner.partner_profile?.business_model || ''
      });
    }
  }, [partner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partner) return;
    
    await onSubmit(partner.id, formData);
  };

  const handleClose = () => {
    setFormData({ role: '', business_model: '' });
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Editar Parceiro: {partner?.name}
            </Dialog.Title>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Conta
              </label>
              <select
                id="edit-role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione uma opção...</option>
                <option value="revendedor">Revendedor</option>
                <option value="distribuidor">Distribuidor</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-business-model" className="block text-sm font-medium text-gray-700 mb-2">
                Modelo de Negócio
              </label>
              <select
                id="edit-business-model"
                value={formData.business_model}
                onChange={(e) => setFormData(prev => ({ ...prev, business_model: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione uma opção...</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'A guardar...' : 'Guardar Alterações'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditPartnerModal;

