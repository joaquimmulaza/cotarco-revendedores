import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoCotarco from '../assets/logo-cotarco.png';
import './Header.css';

const Header = ({ user, onLogout, isAdmin = false, showStockMap = false, onStockMapClick, onLogoClick }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleStockMapClick = () => {
    if (onStockMapClick) {
      onStockMapClick();
    }
  };

  return (
    <header className="header-container bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo e Botão Mapa de Stock (apenas para revendedores) */}
          <div className="flex items-center space-x-4">
            <div 
              onClick={handleLogoClick}
              className="header-logo cursor-pointer"
            >
              <img 
                src={logoCotarco} 
                alt="Cotarco - Tecnologias e Comércio Geral" 
                className="h-12 w-auto object-contain"
              />
            </div>
            
            {/* Botão Mapa de Stock - apenas para revendedores */}
            {!isAdmin && (
              <button
                onClick={handleStockMapClick}
                className={`cursor-pointer px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none ${
                  showStockMap
                    ? 'px-6 py-2  bg-gray-200 text-gray-900 hover: my-text-hover  '
                    : 'px-6 py-2  bg-gray-100 text-gray-700 hover: my-text-hover'
                }`}
              >
                Mapa de Stock
              </button>
            )}
          </div>

          {/* Informações do usuário e botão de logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || (isAdmin ? 'Administrador' : 'Usuário')}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || ''}
              </p>
            </div>
            <button 
              onClick={onLogout}
              className="cursor-pointer logout-button my-stroke-red bg-white my-text-gray px-4 py-2 rounded-lg hover: hover-color transition-colors duration-200 font-medium text-sm my-text-red focus:outline-none "
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
