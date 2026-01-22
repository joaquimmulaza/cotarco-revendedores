import React, { useState, useEffect, useMemo } from 'react';
import ColorSwatch from './swatches/ColorSwatch';
import ButtonSwatch from './swatches/ButtonSwatch';
import { useCart } from '../contexts/CartContext';

const ProductCard = ({ product, onViewDetails }) => {
  // --- Variation Logic ---
  const hasVariations = product.variations && product.variations.length > 0;

  // Initialize selection with the first variation's attributes or defaults
  const [selectedAttributes, setSelectedAttributes] = useState({});

  useEffect(() => {
    if (hasVariations) {
      // Default to the first variation
      const firstVar = product.variations[0];
      if (firstVar && firstVar.attributes) {
        const initialAttrs = {};
        firstVar.attributes.forEach(attr => {
          initialAttrs[attr.name] = attr.option;
        });
        setSelectedAttributes(initialAttrs);
      }
    }
  }, [product.id, hasVariations]); // Reset when product changes

  // Find valid variation based on current selection
  const currentVariation = useMemo(() => {
    if (!hasVariations) return null;
    return product.variations.find(v => {
      // Check if all selected attributes match this variation
      return v.attributes.every(attr => selectedAttributes[attr.name] === attr.option);
    }) || product.variations[0]; // Fallback to first if perfect match not found (e.g. invalid combo)
  }, [product.variations, selectedAttributes, hasVariations]);

  // Display Values (Use Variation if available, else Parent)
  const displayProduct = currentVariation || product;
  const displayImage = displayProduct.image_url || product.image_url;
  const displayPrice = displayProduct.formatted_price; // Resource handles formatting
  const displayOriginalPrice = displayProduct.formatted_original_price;
  const displayDiscount = displayProduct.discount_percentage;
  const displayStockStatus = displayProduct.stock_status;

  const { addToCart } = useCart();

  const cleanName = (name) => {
    if (!name) return '';
    return name.split(' - ')[0];
  };

  // Handler for attribute selection
  const handleAttributeSelect = (name, value) => {
    let nextAttributes = { ...selectedAttributes, [name]: value };

    const isColorAttr = name.toLowerCase().includes('color') || name.toLowerCase().includes('cor');

    // If changing a color, ensure other selected attributes are valid for this new color
    if (isColorAttr) {
      // Get all variations that match this new color
      const possibleVariations = product.variations.filter(v =>
        v.attributes.some(a => a.name === name && a.option === value)
      );

      // For each *other* attribute currently selected
      Object.keys(nextAttributes).forEach(key => {
        const isKeyColor = key.toLowerCase().includes('color') || key.toLowerCase().includes('cor');
        if (key !== name && !isKeyColor) {
          const currentVal = nextAttributes[key];

          // Check if the current value for this attribute exists in the new color's variations
          const isValid = possibleVariations.some(v =>
            v.attributes.some(a => a.name === key && a.option === currentVal)
          );

          // If not valid, switch to the first available option for this attribute
          if (!isValid && possibleVariations.length > 0) {
            const fallbackAttr = possibleVariations[0].attributes.find(a => a.name === key);
            if (fallbackAttr) {
              nextAttributes[key] = fallbackAttr.option;
            }
          }
        }
      });
    }

    setSelectedAttributes(nextAttributes);
  };

  const getStockStatusBadge = (status) => {
    if (displayPrice === 'Sob consulta') {
      return (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
        >
          Sob consulta
        </span>
      );
    }
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
    <div className="group bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl hover:transform hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Área da Imagem */}
      <div className="relative aspect-square bg-gray-50 p-4 flex items-center justify-center overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayProduct.name || product.name}
            className="w-full h-full object-contain transition-transform duration-300 transform group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center ${displayImage ? 'hidden' : 'flex'
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

        {/* Helper Action (Optional: View Details on Hover over image) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 cursor-pointer"
          onClick={() => onViewDetails && onViewDetails(product)}
        />

        {/* Badge de Desconto */}
        {displayDiscount > 0 && (
          <div className="absolute top-2 left-2 z-20">
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-green-800 bg-green-100 border border-green-200 rounded">
              -{displayDiscount}%
            </span>
          </div>
        )}
      </div>

      {/* Área de Conteúdo */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Nome do Produto */}
        <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight min-h-[2.5em]"
          title={product.name}>
          {cleanName(product.name)}
        </h3>

        {/* Swatches Area */}
        {hasVariations && product.attributes && (
          <div className="mb-4 space-y-3">
            {product.attributes.map(attr => (
              <div key={attr.id || attr.name} className="flex flex-col gap-1">
                {/* <span className="text-xs font-semibold text-gray-500 uppercase">{attr.name}:</span> */}
                <div className="flex flex-wrap gap-2">
                  {attr.options && attr.options.map(option => {
                    const isSelected = selectedAttributes[attr.name] === option;
                    const isColor = attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('cor');

                    // Filter Logic: If this is NOT a color, check if it's available for the currently selected color
                    if (!isColor) {
                      // Find the currently selected color
                      const selectedColorEntry = Object.entries(selectedAttributes).find(([k]) =>
                        k.toLowerCase().includes('color') || k.toLowerCase().includes('cor')
                      );

                      if (selectedColorEntry) {
                        const [colorName, colorVal] = selectedColorEntry;
                        // Check if a variation exists with (Color=SelectedColor AND CurrentAttr=Option)
                        const exists = product.variations.some(v =>
                          v.attributes.some(a => a.name === colorName && a.option === colorVal) &&
                          v.attributes.some(a => a.name === attr.name && a.option === option)
                        );

                        if (!exists) return null; // Hide unavailable option
                      }
                    }

                    if (isColor) {
                      return (
                        <ColorSwatch
                          key={option}
                          colorName={option}
                          selected={isSelected}
                          onClick={(e) => { e.stopPropagation(); handleAttributeSelect(attr.name, option); }}
                        />
                      );
                    }
                    return (
                      <ButtonSwatch
                        key={option}
                        label={option}
                        selected={isSelected}
                        onClick={(e) => { e.stopPropagation(); handleAttributeSelect(attr.name, option); }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto">
          {/* Preço */}
          <div className="mb-3 flex items-center flex-wrap gap-2">
            {displayDiscount > 0 && displayOriginalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {displayOriginalPrice}
              </span>
            )}
            <span className="text-lg font-semibold text-gray-900">
              {displayPrice === 'Sob consulta' ? null : displayPrice}
            </span>
          </div>

          {/* Footer: Stock & Action */}
          <div className="flex items-center justify-between mt-2">
            {getStockStatusBadge(displayStockStatus)}

            {displayStockStatus === 'instock' && displayPrice !== 'Sob consulta' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const priceNumber = Number(displayProduct.price || displayProduct.regular_price || 0);
                  const item = { ...displayProduct, price: priceNumber, sku: displayProduct.sku };
                  addToCart(item, 1);
                }}
                className="cursor-pointer px-3 py-1.5 rounded my-bg-red text-white text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                Adicionar
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;
