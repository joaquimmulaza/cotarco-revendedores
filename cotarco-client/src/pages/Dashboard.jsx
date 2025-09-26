import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import StockFileDownloader from '../components/StockFileDownloader';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { productService } from '../services/api';
import ProductDetailModal from '../components/ProductDetailModal';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Estado para controlar se está a mostrar o mapa de stock
  const [showStockMap, setShowStockMap] = useState(false);

  // Estados para produtos e categorias
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [productsError, setProductsError] = useState(null);
  const [noCategories, setNoCategories] = useState(false);
  const [noProducts, setNoProducts] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1
  });

  // Estado do modal de detalhes de produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Simular loading inicial (removido, não utilizado)

  // Carregar categorias na primeira renderização
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesError(null);
        setNoCategories(false);
        const response = await productService.getCategories();
        if (response.success) {
          if (response.data.length > 0) {
            setCategories(response.data);
            setSelectedCategory(response.data[0].id);
          } else {
            setNoCategories(true);
            setCategories([]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        setCategoriesError('Não foi possível carregar as categorias. Tente novamente mais tarde.');
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
        setProductsError(null);
        setNoProducts(false);
        const response = await productService.getProducts(
          selectedCategory,
          paginationInfo.currentPage,
          10
        );
        if (response.success) {
          if (response.data.length > 0) {
            setProducts(response.data);
            setPaginationInfo(prev => ({
              ...prev,
              totalPages: response.pagination.total_pages
            }));
          } else {
            setNoProducts(true);
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setProductsError('Não foi possível carregar os produtos. Tente novamente mais tarde.');
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

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
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
              

              
             

              {/* Categories Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Categorias</h3>
                {loadingCategories ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }, (_, index) => (
                      <Skeleton key={index} height={36} width={120} className="rounded-lg" />
                    ))}
                  </div>
                ) : categoriesError ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Erro ao carregar categorias</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{categoriesError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : noCategories ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Nenhuma categoria encontrada</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Nenhum produto encontrado no momento.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'my-bg-red text-white'
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }, (_, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <Skeleton height={120} className="mb-3 rounded" />
                        <Skeleton height={16} className="mb-2" />
                        <Skeleton height={14} width="60%" className="mb-2" />
                        <Skeleton height={20} width="40%" />
                      </div>
                    ))}
                  </div>
                ) : productsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Erro ao carregar produtos</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{productsError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : noProducts ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Nenhum produto encontrado</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Nenhum produto encontrado no momento.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
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
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </div>
  );
};

export default Dashboard;

