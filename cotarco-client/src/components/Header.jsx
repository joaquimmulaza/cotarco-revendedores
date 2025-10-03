import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoCotarco from '../assets/logo-cotarco.png';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './Header.css';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../contexts/CartContext.jsx';

const Header = ({ user, onLogout, isAdmin = false, showStockMap = false, onStockMapClick, onLogoClick, loading = false, onCartClick }) => {
  const navigate = useNavigate();
  const { totalItems } = useCart();

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
              <div className="relative ml-6">
                <button
                  onClick={handleStockMapClick}
                  className={`cursor-pointer px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none relative z-10 ${
                    showStockMap
                      ? 'bg-[#F23C13] text-white hover:bg-[#E0350F]'
                      : 'bg-[#F23C13] text-white hover:bg-[#E0350F]'
                  }`}
                >
                  Mapa de Stock
                </button>
                {/* Efeito sonar pulsante */}
                <div 
                  className="absolute inset-x-1 -inset-y-1 rounded-lg bg-[#F23C13] opacity-25" 
                  style={{
                    animation: 'customPing 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                    transformOrigin: 'center'
                  }}
                ></div>
                <style jsx>{`
                  @keyframes customPing {
                    0% {
                      transform: scale(1);
                      opacity: 0.5;
                    }
                    75%, 100% {
                      transform: scale(1.3);
                      opacity: 0;
                    }
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* Carrinho (apenas parceiros), informações do usuário e logout */}
          <div className="flex items-center space-x-4">
            {!isAdmin && user?.role === 'distribuidor' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={onCartClick}
                  className="relative inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
                  aria-label="Abrir carrinho"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 px-1.5 py-0 text-[10px] leading-none">
                      {totalItems}
                    </Badge>
                  )}
                </button>
              </div>
            )}
            <div className="hidden sm:block text-right">
              {loading ? (
                <div className="space-y-1">
                  <Skeleton width={96} height={16} />
                  <Skeleton width={128} height={12} />
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || (isAdmin ? 'Administrador' : 'Usuário')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || ''}
                  </p>
                </>
              )}
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
