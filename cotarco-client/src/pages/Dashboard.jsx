import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import StockFileDownloader from '../components/StockFileDownloader';
import Header from '../components/Header';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { productService } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Estado para controlar se está a mostrar o mapa de stock
  const [showStockMap, setShowStockMap] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados para produtos e categorias
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1
  });

  // Simular loading inicial
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Carregar categorias na primeira renderização
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await productService.getCategories();
        if (response.success && response.data.length > 0) {
          setCategories(response.data);
          setSelectedCategory(response.data[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Carregar produtos quando selectedCategory ou paginationInfo.currentPage mudar
  useEffect(() => {
    if (selectedCategory === null) return;

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await productService.getProducts(
          selectedCategory,
          paginationInfo.currentPage,
          12
        );
        if (response.success) {
          setProducts(response.data);
          setPaginationInfo(prev => ({
            ...prev,
            totalPages: response.pagination.total_pages
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [selectedCategory, paginationInfo.currentPage]);

  const handleStockMapClick = () => {
    setShowStockMap(true);
  };

  const handleLogoClick = () => {
    setShowStockMap(false);
  };

  // Funções para manipular categorias e paginação
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setPaginationInfo(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePreviousPage = () => {
    if (paginationInfo.currentPage > 1) {
      setPaginationInfo(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const handleNextPage = () => {
    if (paginationInfo.currentPage < paginationInfo.totalPages) {
      setPaginationInfo(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {loading ? (
                    // Skeleton Loading para produtos
                    Array.from({ length: 15 }, (_, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 text-center h-24 flex items-center justify-center"
                      >
                        <Skeleton width={32} height={32} className="mx-auto mb-2" />
                        <Skeleton width={60} height={16} />
                      </div>
                    ))
                  ) : (
                    // Produtos reais
                    [
                      "Acessórios",
                      "Acessórios Maquinas de Lavar", 
                      "Suportes Tv",
                      "Aspiradores",
                      "Ar condicionado",
                      "Equipamentos de Som",
                      "Frigoríficos",
                      "Maquinas De Lavar",
                      "Micro ondas",
                      "Monitores",
                      "Telemóveis",
                      "TVs",
                      "Acessórios",
                      "Aspiradores",
                      
                    ].map((productName, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 text-center hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer h-24 flex items-center justify-center"
                      >
                        <span className="text-sm font-medium text-gray-600 leading-tight break-words hyphens-auto">
                          {productName}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Categories Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Categorias</h3>
                {loadingCategories ? (
                  <p className="text-gray-500">A carregar categorias...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Products Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Produtos</h3>
                {loadingProducts ? (
                  <p className="text-gray-500">A carregar produtos...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="border border-gray-200 rounded-lg p-4 text-center hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].src}
                              alt={product.name}
                              className="w-16 h-16 object-cover mx-auto mb-2 rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-500 mb-2">
                            {product.price_html || 'Preço não disponível'}
                          </p>
                          <span className="text-xs text-gray-400">
                            {product.stock_status === 'instock' ? 'Em stock' : 'Fora de stock'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {paginationInfo.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handlePreviousPage}
                          disabled={paginationInfo.currentPage === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-gray-700">
                          Página {paginationInfo.currentPage} de {paginationInfo.totalPages}
                        </span>
                        <button
                          onClick={handleNextPage}
                          disabled={paginationInfo.currentPage === paginationInfo.totalPages}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Próximo
                        </button>
                      </div>
                    )}
                  </>
                )}
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

