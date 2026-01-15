import React from 'react';

const ProductCard = ({ product, onViewDetails }) => {
  const getStockStatusBadge = (status) => {
    const isInStock = status === 'instock';

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isInStock
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
          }`}
      >
        {isInStock ? 'Em stock' : 'Fora de stock'}
      </span>
    );
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl hover:transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Área da Imagem */}
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 transform group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : 'flex'
            }`}
        >
          <svg
            className="w-16 h-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        {/* Overlay e Botão "Ver Detalhes" */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            onClick={() => onViewDetails && onViewDetails(product)}
            className="px-4 py-2 rounded-md bg-white/90 text-gray-900 font-medium shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ver Detalhes
          </button>
        </div>

        {/* Badge de Desconto */}
        {product.discount_percentage > 0 && (
          <div className="absolute top-2 left-2 z-20">
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-green-800 bg-green-100 border border-green-200 rounded">
              -{product.discount_percentage}%
            </span>
          </div>
        )}
      </div>

      {/* Área de Conteúdo */}
      <div className="p-4">
        {/* Nome do Produto */}
        <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Preço */}
        <div className="mb-3 flex items-center gap-2">
          {product.discount_percentage > 0 && product.formatted_original_price && (
            <span className="text-sm text-gray-500 line-through">
              {product.formatted_original_price}
            </span>
          )}
          <span className="text-lg font-semibold text-gray-900">
            {product.formatted_price}
          </span>
        </div>

        {/* Status do Stock */}
        <div className="flex justify-start">
          {getStockStatusBadge(product.stock_status)}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
