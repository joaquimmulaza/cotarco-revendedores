import React from 'react';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar ação", 
  description = "Tem a certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning" // warning, danger, info
}) => {
  const getIconAndColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'my-text-red',
          iconBg: 'bg-red-100',
          confirmButton: 'my-bg-red hover:bg-red-700 focus:ring-red-500',
          confirmText: 'text-white'
        };
      case 'info':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          confirmText: 'text-white'
        };
      default: // warning
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          confirmText: 'text-white'
        };
    }
  };

  const { icon: Icon, iconColor, iconBg, confirmButton, confirmText: confirmTextColor } = getIconAndColors();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-sm rounded bg-white p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-medium text-gray-700">
                {title}
              </DialogTitle>
              <Description className="mt-1 text-sm text-gray-500">
                {description}
              </Description>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 rounded-md px-3 py-2 text-sm cursor-pointer font-semibold ${confirmTextColor} shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default ConfirmDialog;
