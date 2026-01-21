import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { useCart } from '../contexts/CartContext.jsx';
import QuantityInput from './QuantityInput.jsx';
import ColorSwatch from './swatches/ColorSwatch.jsx';
import ButtonSwatch from './swatches/ButtonSwatch.jsx';
import { useMemo } from 'react';

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modal = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.98 }
};

const ProductDetailModal = ({ isOpen, onClose, product }) => {
  const [quantity, setQuantity] = useState(1);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  useEffect(() => {
    if (product) {
      setQuantity(1);
    }
  }, [product]);
  useEffect(() => {
    if (product?.custom_description_url) {
      setIframeLoaded(false);
    }
  }, [product?.custom_description_url]);
  const { addToCart } = useCart();

  // --- Variation Logic ---
  const hasVariations = product?.variations && product.variations.length > 0;
  const [selectedAttributes, setSelectedAttributes] = useState({});

  useEffect(() => {
    if (hasVariations) {
      const firstVar = product.variations[0];
      if (firstVar && firstVar.attributes) {
        const initialAttrs = {};
        firstVar.attributes.forEach(attr => {
          initialAttrs[attr.name] = attr.option;
        });
        setSelectedAttributes(initialAttrs);
      }
    } else if (product?.attributes) {
      const initialAttrs = {};
      product.attributes.forEach(attr => {
        if (attr.option) {
          initialAttrs[attr.name] = attr.option;
        }
      });
      setSelectedAttributes(initialAttrs);
    }
  }, [product, hasVariations]);

  const currentVariation = useMemo(() => {
    if (!hasVariations) return null;
    return product.variations.find(v => {
      return v.attributes.every(attr => selectedAttributes[attr.name] === attr.option);
    }) || product.variations[0];
  }, [product?.variations, selectedAttributes, hasVariations]);

  const displayProduct = currentVariation || product;

  const cleanName = (name) => {
    if (!name) return '';
    return name.split(' - ')[0];
  };

  const handleAttributeSelect = (name, value) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    const priceNumber = Number(displayProduct.price || displayProduct.regular_price || 0);
    const item = { ...displayProduct, price: priceNumber, sku: displayProduct.sku };
    addToCart(item, quantity);
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
          <motion.div
            className="fixed inset-0 bg-black/40"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdrop}
          />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel as={motion.div}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modal}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="relative w-full max-w-5xl rounded-xl bg-white p-6 shadow-xl"
              >
                {/* Botão fechar no canto superior direito */}
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={onClose}
                  className="z-50 absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                >
                  ×
                </button>

                {/* Renderização condicional: apenas mostra conteúdo se existir product */}
                {!product ? null : (
                  <div className="grid gap-6 md:grid-cols-2 lg:gap-12">
                    {product.custom_description_url ? (
                      <>
                        {/* Coluna Esquerda: Carousel + título, preço e botão */}
                        <div>
                          <Carousel className="relative w-full overflow-hidden rounded-lg bg-gray-50">
                            <CarouselContent>
                              {(product.images || []).map((image, index) => (
                                <CarouselItem key={index} className="flex items-center justify-center">
                                  <img
                                    src={image?.src || image?.url || ''}
                                    alt={product.name}
                                    className="max-h-[420px] w-full object-contain"
                                  />
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2 md:left-3 lg:left-4 z-10" />
                            <CarouselNext className="right-2 md:right-3 lg:right-4 z-10" />
                          </Carousel>

                          <div className="mt-4">
                            <h2 className="mb-3 text-2xl font-bold text-gray-900">{cleanName(product.name)}</h2>
                            <div className="mb-4 flex flex-col items-start">
                              {displayProduct.discount_percentage > 0 && displayProduct.formatted_original_price ? (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg text-gray-500 line-through">
                                    {displayProduct.formatted_original_price}
                                  </span>
                                  <span className="text-sm font-semibold text-green-800 bg-green-100 px-2 py-0.5 rounded">
                                    -{displayProduct.discount_percentage}%
                                  </span>
                                </div>
                              ) : null}
                              <p className="text-xl font-bold text-gray-900">{displayProduct.formatted_price}</p>
                            </div>

                            {/* Swatches Area */}
                            {hasVariations && product.attributes && (
                              <div className="mb-6 space-y-4">
                                {product.attributes.map(attr => (
                                  <div key={attr.id || attr.name} className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">{attr.name}:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {attr.options && attr.options.map(option => {
                                        const isSelected = selectedAttributes[attr.name] === option;
                                        const isColor = attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('cor');

                                        if (isColor) {
                                          return (
                                            <ColorSwatch
                                              key={option}
                                              colorName={option}
                                              selected={isSelected}
                                              onClick={() => handleAttributeSelect(attr.name, option)}
                                            />
                                          );
                                        }
                                        return (
                                          <ButtonSwatch
                                            key={option}
                                            label={option}
                                            selected={isSelected}
                                            onClick={() => handleAttributeSelect(attr.name, option)}
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-4">
                              <QuantityInput value={quantity} onChange={setQuantity} min={1} />
                              <Button
                                type="button"
                                size="lg"
                                disabled={displayProduct.stock_status !== 'instock'}
                                onClick={handleAddToCart}
                              >
                                Adicionar ao Carrinho
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Coluna Direita: Apenas iframe com skeleton loading */}
                        <div className="relative">
                          {!iframeLoaded && (
                            <div className="w-full min-h-[75vh] rounded-lg border bg-gray-100 p-4 animate-pulse">
                              <div className="h-6 w-40 bg-gray-300 rounded mb-4" />
                              <div className="h-4 w-3/4 bg-gray-300 rounded mb-2" />
                              <div className="h-4 w-2/3 bg-gray-300 rounded mb-2" />
                              <div className="h-4 w-1/2 bg-gray-300 rounded mb-6" />
                              <div className="h-[48vh] w-full bg-gray-200 rounded" />
                            </div>
                          )}
                          <iframe
                            src={product.custom_description_url}
                            title={product.name || 'Descrição Detalhada'}
                            className={`w-full h-full min-h-[75vh] border-none rounded-lg ${iframeLoaded ? '' : 'invisible absolute top-0 left-0'}`}
                            sandbox="allow-scripts allow-same-origin"
                            onLoad={() => setIframeLoaded(true)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Coluna Esquerda: Apenas Carousel */}
                        <div>
                          <Carousel className="relative w-full overflow-hidden rounded-lg bg-gray-50">
                            <CarouselContent>
                              {(product.images || []).map((image, index) => (
                                <CarouselItem key={index} className="flex items-center justify-center">
                                  <img
                                    src={image?.src || image?.url || ''}
                                    alt={product.name}
                                    className="max-h-[420px] w-full object-contain"
                                  />
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2 md:left-3 lg:left-4 z-10" />
                            <CarouselNext className="right-2 md:right-3 lg:right-4 z-10" />
                          </Carousel>
                        </div>

                        {/* Coluna Direita: Título, preço, botão e descrição fallback */}
                        <div>
                          <h2 className="mb-3 text-2xl font-bold text-gray-900">{cleanName(product.name)}</h2>
                          <div className="mb-4 flex flex-col items-start">
                            {displayProduct.discount_percentage > 0 && displayProduct.formatted_original_price ? (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg text-gray-500 line-through">
                                  {displayProduct.formatted_original_price}
                                </span>
                                <span className="text-sm font-semibold text-green-800 bg-green-100 px-2 py-0.5 rounded">
                                  -{displayProduct.discount_percentage}%
                                </span>
                              </div>
                            ) : null}
                            <p className="text-xl font-bold text-gray-900">{displayProduct.formatted_price}</p>
                          </div>

                          {/* Swatches Area */}
                          {hasVariations && product.attributes && (
                            <div className="mb-6 space-y-4">
                              {product.attributes.map(attr => (
                                <div key={attr.id || attr.name} className="flex flex-col gap-2">
                                  <span className="text-xs font-semibold text-gray-500 uppercase">{attr.name}:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {attr.options && attr.options.map(option => {
                                      const isSelected = selectedAttributes[attr.name] === option;
                                      const isColor = attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('cor');

                                      if (isColor) {
                                        return (
                                          <ColorSwatch
                                            key={option}
                                            colorName={option}
                                            selected={isSelected}
                                            onClick={() => handleAttributeSelect(attr.name, option)}
                                          />
                                        );
                                      }
                                      return (
                                        <ButtonSwatch
                                          key={option}
                                          label={option}
                                          selected={isSelected}
                                          onClick={() => handleAttributeSelect(attr.name, option)}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-6 flex items-center gap-4">
                            <QuantityInput value={quantity} onChange={setQuantity} min={1} />
                            <Button
                              type="button"
                              size="lg"
                              disabled={displayProduct.stock_status !== 'instock'}
                              onClick={handleAddToCart}
                            >
                              Adicionar ao Carrinho
                            </Button>
                          </div>

                          <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Descrição do Produto</h3>
                            <div className="text-sm text-gray-600 border p-2 rounded-md max-h-64 overflow-y-auto">
                              {product.description ? (
                                <div className="prose max-w-none p-2" dangerouslySetInnerHTML={{ __html: product.description }} />
                              ) : product.short_description ? (
                                <div className="prose max-w-none p-2" dangerouslySetInnerHTML={{ __html: product.short_description }} />
                              ) : (
                                <p className="p-2">Nenhuma descrição disponível.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;
