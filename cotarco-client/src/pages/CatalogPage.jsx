import { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import { LayoutGrid } from 'lucide-react';

const CatalogPage = () => {
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
    totalPages: 1,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Carregar categorias
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

  // Carregar produtos quando categoria ou página mudar
  useEffect(() => {
    if (selectedCategory === null && categories.length > 0) {
      setSelectedCategory(categories[0].id);
      return;
    }
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
              totalPages: response.pagination.total_pages,
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
  }, [selectedCategory, categories, paginationInfo.currentPage]);

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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Catálogo de Produtos</h1>
          <p className="text-sm text-slate-500">Pesquise e adicione produtos ao carrinho</p>
        </div>
      </div>

      {/* Categorias */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Categorias</h3>
        {loadingCategories ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height={36} width={120} className="rounded-lg" />
            ))}
          </div>
        ) : categoriesError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{categoriesError}</p>
          </div>
        ) : noCategories ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">Nenhuma categoria encontrada.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2" data-testid="categories-list">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors category-button ${
                  selectedCategory === category.id
                    ? 'my-bg-red text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-category-id={category.id}
                data-active={selectedCategory === category.id}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Produtos */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Produtos</h3>
        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <Skeleton height={120} className="mb-3 rounded" />
                <Skeleton height={16} className="mb-2" />
                <Skeleton height={14} width="60%" className="mb-2" />
                <Skeleton height={20} width="40%" />
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{productsError}</p>
          </div>
        ) : noProducts ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">Nenhum produto encontrado no momento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
              ))}
            </div>

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

      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </div>
  );
};

export default CatalogPage;
