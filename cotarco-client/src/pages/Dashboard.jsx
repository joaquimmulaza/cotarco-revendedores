import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import StockFileDownloader from '../components/StockFileDownloader';
import Header from '../components/Header';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Estado para controlar se está a mostrar o mapa de stock
  const [showStockMap, setShowStockMap] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simular loading inicial
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleStockMapClick = () => {
    setShowStockMap(true);
  };

  const handleLogoClick = () => {
    setShowStockMap(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        user={user}
        onLogout={logout}
        title="Dashboard do Revendedor"
        isAdmin={false}
        showStockMap={showStockMap}
        onStockMapClick={handleStockMapClick}
        onLogoClick={handleLogoClick}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!showStockMap ? (
            // Conteúdo da página inicial
            <div className="space-y-8">
              {/* Stats Cards */}
              

              {/* Product Grid - Placeholder */}
              <div 
                className="bg-white shadow rounded-lg p-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {loading ? (
                    // Skeleton Loading para produtos
                    Array.from({ length: 15 }, (_, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 text-center"
                      >
                        <Skeleton width={32} height={32} className="mx-auto mb-2" />
                        <Skeleton width={60} height={16} />
                      </div>
                    ))
                  ) : (
                    // Produtos reais
                    [
                      { name: "Acessórios", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" },
                      { name: "Acessórios Maquinas de Lavar", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
                      { name: "Suportes Tv", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                      { name: "Aspiradores", icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" },
                      { name: "Ar condicionado", icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" },
                      { name: "Equipamentos de Som", icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" },
                      { name: "Frigoríficos", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2zM8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4M8 21H5a2 2 0 01-2-2V7a2 2 0 012-2h3m8 16h3a2 2 0 002-2V7a2 2 0 00-2-2h-3" },
                      { name: "Maquinas De Lavar", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
                      { name: "Micro ondas", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
                      { name: "Monitores", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                      { name: "Telemóveis", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
                      { name: "TVs", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                      { name: "Acessórios", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" },
                      { name: "Aspiradores", icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" },
                      
                    ].map((product, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 text-center hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="text-gray-400 mb-2">
                          <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={product.icon} />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-600">{product.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Under Construction Section */}
              <div 
                className="bg-gradient-to-br from-blue-50  to-indigo-100 border border-red-subtle rounded-2xl p-12 text-center"
              >
                <div
                  className="mb-6"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 my-bg-red-op rounded-full mb-4">
                    <svg className="w-10 h-10 my-text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                </div>
                
                <h2 
                  className="text-4xl font-bold text-gray-900 mb-4"
                >
                  Em Construção
                </h2>
                
                <p 
                  className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
                >
                  Estamos a trabalhar para trazer-lhe funcionalidades ainda mais poderosas. 
                  Esta secção estará disponível em breve...
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 hidden">
                <div 
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 text-primary">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Vendas este mês
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            0
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 text-primary">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Comissões pendentes
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            0
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 text-primary">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Encomendas ativas
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            0
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Recent Activity */}
              <div 
                className="bg-white shadow rounded-lg hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Atividade recente
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Nova encomenda #1234
                        </p>
                        <p className="text-sm text-gray-500">
                          Cliente: Maria Santos - 150
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        Há 2 horas
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Comissão processada
                        </p>
                        <p className="text-sm text-gray-500">
                          45 creditado na conta
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        Ontem
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Encomenda entregue #1230
                        </p>
                        <p className="text-sm text-gray-500">
                          Cliente: António Silva - 200
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        Há 2 dias
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Mapa de Stock
            <div>
              <StockFileDownloader />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

