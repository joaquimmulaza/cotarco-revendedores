import React from 'react';

const ProductCard = ({ product }) => {
  const getStockStatusBadge = (status) => {
    const isInStock = status === 'instock';
    
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isInStock
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {isInStock ? 'Em stock' : 'Fora de stock'}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl hover:transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Área da Imagem */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full flex items-center justify-center ${
            product.image_url ? 'hidden' : 'flex'
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
      </div>

      {/* Área de Conteúdo */}
      <div className="p-4">
        {/* Nome do Produto */}
        <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Preço */}
        <div className="mb-3">
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
