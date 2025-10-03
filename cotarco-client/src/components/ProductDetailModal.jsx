import React from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';

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
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                >
                  ×
                </button>

                {/* Renderização condicional: apenas mostra conteúdo se existir product */}
                {!product ? null : (
                  <div className="grid gap-6 md:grid-cols-2 lg:gap-12">
                    {/* Coluna Esquerda: Carousel de imagens */}
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

                    {/* Coluna Direita: Detalhes do produto */}
                    <div>
                      <h2 className="mb-3 text-2xl font-bold text-gray-900">{product.name}</h2>
                      <p className="mb-4 text-xl text-gray-900">{product.formatted_price}</p>

                      <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Descrição do Produto</h3>
                        <div className="text-sm text-gray-600 border p-2 rounded-md">
                          {product.custom_description_url ? (
                            <iframe
                              src={product.custom_description_url}
                              title={product.name || 'Descrição Detalhada'}
                              className="w-full h-[80vh] border-none rounded-md"
                              sandbox="allow-scripts allow-same-origin"
                            />
                          ) : product.description ? (
                            <div className="prose max-w-none p-2" dangerouslySetInnerHTML={{ __html: product.description }} />
                          ) : product.short_description ? (
                            <div className="prose max-w-none p-2" dangerouslySetInnerHTML={{ __html: product.short_description }} />
                          ) : (
                            <p className="p-2">Nenhuma descrição detalhada disponível.</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button
                          type="button"
                          disabled={product.stock_status !== 'instock'}
                        >
                          Adicionar ao Carrinho
                        </Button>
                      </div>
                    </div>
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



