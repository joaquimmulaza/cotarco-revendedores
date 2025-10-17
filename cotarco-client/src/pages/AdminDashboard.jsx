import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StockFileManager from '../components/StockFileManager';
import Header from '../components/Header';
import PartnerManager from '../components/admin/PartnerManager';
import { UserGroupIcon, DocumentDuplicateIcon, CubeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import ProductListViewer from '../components/admin/ProductListViewer';
import OrderList from '../components/admin/OrderList';
import { OrderDetailPage } from './OrderDetailPage';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const location = useLocation();

  const navigationTabs = [
    { name: 'Gestão de Parceiros', href: '/admin/dashboard/partners', icon: UserGroupIcon, path: '/admin/dashboard/partners' },
    { name: 'Mapa de Stock', href: '/admin/dashboard/stock-files', icon: DocumentDuplicateIcon, path: '/admin/dashboard/stock-files' },
    { name: 'Gestão de Produtos', href: '/admin/dashboard/product-list', icon: CubeIcon, path: '/admin/dashboard/product-list' },
    { name: 'Encomendas', href: '/admin/dashboard/orders', icon: ShoppingCartIcon, path: '/admin/dashboard/orders' },
  ];

  const isSelected = (tab) => {
    if (tab.path === '/admin/dashboard/orders' && location.pathname.startsWith('/admin/dashboard/orders/')) {
      return true;
    }
    return location.pathname === tab.path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user}
        onLogout={logout}
        title="Painel de Administração"
        isAdmin={true}
        loading={authLoading}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {navigationTabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.href}
              className={
                classNames(
                  'bg-white overflow-hidden shadow rounded-lg transition-all duration-200 ease-in-out transform focus:outline-none',
                  isSelected(tab) ? 'my-stroke-red scale-100' : 'hover:shadow-lg hover:-translate-y-1'
                )
              }
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <tab.icon 
                      className={`h-8 w-8 ${isSelected(tab) ? 'my-text-red' : 'text-gray-400'}`} 
                      aria-hidden="true" 
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="text-lg font-medium text-gray-700 truncate">
                      {tab.name}
                    </p>
                  </div>
                </div>
              </div>
            </NavLink>
          ))}
        </div>

        <Routes>
          <Route index element={<PartnerManager />} />
          <Route path="partners" element={<PartnerManager />} />
          <Route path="stock-files" element={<StockFileManager />} />
          <Route path="product-list" element={<ProductListViewer />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
