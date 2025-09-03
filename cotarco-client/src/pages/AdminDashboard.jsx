import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import StockFileManager from '../components/StockFileManager';
import Header from '../components/Header';
import PartnerManager from '../components/admin/PartnerManager';
import { UserGroupIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigationTabs = [
    { name: 'Gestão de Parceiros', icon: UserGroupIcon },
    { name: 'Mapa de Stock', icon: DocumentDuplicateIcon },
  ];

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
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          {/* Navegação Principal em formato de Cards */}
          <Tab.List className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {navigationTabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'bg-white overflow-hidden shadow rounded-lg transition-all duration-200 ease-in-out transform focus:outline-none',
                    selected ? 'my-stroke-red scale-100' : 'hover:shadow-lg hover:-translate-y-1'
                  )
                }
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <tab.icon 
                        className={`h-8 w-8 ${selectedIndex === index ? 'my-text-red' : 'text-gray-400'}`} 
                        aria-hidden="true" 
                      />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <p className="text-lg font-medium text-gray-900 truncate">
                        {tab.name}
                      </p>
                    </div>
                  </div>
                </div>
              </Tab>
            ))}
                </Tab.List>

          {/* Painéis de Conteúdo com Animação */}
          <Tab.Panels>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <Tab.Panel>
                  <PartnerManager />
                </Tab.Panel>
                <Tab.Panel>
                  <StockFileManager />
                </Tab.Panel>
              </motion.div>
            </AnimatePresence>
          </Tab.Panels>
        </Tab.Group>
      </main>
    </div>
  );
};

export default AdminDashboard;
