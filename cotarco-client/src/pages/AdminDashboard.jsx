import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';
import StockFileManager from '../components/StockFileManager';
import PartnerManager from '../components/admin/PartnerManager';
import { UserGroupIcon, DocumentDuplicateIcon, CubeIcon, ShoppingCartIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import ProductListViewer from '../components/admin/ProductListViewer';
import OrderList from '../components/admin/OrderList';
import MetricsGrid from '../components/admin/MetricsGrid';
import DashboardOverview from '../components/admin/DashboardOverview';
import { OrderDetailPage } from './OrderDetailPage';
import UnderConstruction from './UnderConstruction';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminDashboard = () => {
  const { user, authLoading } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResponse, productsResponse] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getTopProducts(5)
        ]);
        setStats(statsResponse.data);
        setTopProducts(productsResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const navigationTabs = [
    { name: 'Visão Geral', href: '/admin/dashboard/overview', icon: ChartBarIcon, path: '/admin/dashboard/overview' },
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
    <div className="w-full">
      <MetricsGrid stats={stats} loading={loading} />
      
      <div className="hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {navigationTabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.href}
            data-testid="admin-stats-card"
            className={
              classNames(
                'bg-white overflow-hidden shadow-sm border border-gray-100 rounded-xl transition-all duration-200 ease-in-out transform focus:outline-none',
                isSelected(tab) ? 'ring-2 ring-[#f22f1d] ring-offset-2' : 'hover:shadow-md hover:-translate-y-0.5'
              )
            }
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <tab.icon
                    className={`h-6 w-6 ${isSelected(tab) ? 'text-[#f22f1d]' : 'text-gray-400'}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {tab.name}
                  </p>
                </div>
              </div>
            </div>
          </NavLink>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<DashboardOverview stats={stats} topProducts={topProducts} loading={loading} />} />
          <Route path="partners" element={<PartnerManager />} />
          <Route path="stock-files" element={<StockFileManager />} />
          <Route path="product-list" element={<ProductListViewer />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="settings" element={<UnderConstruction title="Definições" />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
