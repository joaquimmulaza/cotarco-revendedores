import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import QuantityInput from './QuantityInput.jsx';
import { useCart } from '../contexts/CartContext.jsx';

export default function CartDrawer({ open, onOpenChange }) {
  const { items, subtotal, updateQuantity, removeFromCart } = useCart();
  const formatCurrency = (value) => (Number(value) || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Meu Carrinho de Compras</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4 space-y-4">
          {items.length === 0 ? (
            <p>O seu carrinho está vazio.</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 border-b pb-3">
                <img
                  src={it.images?.[0]?.src || it.image || ''}
                  alt={it.name}
                  className="h-16 w-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{it.name}</p>
                  <p className="text-sm text-gray-600">{it.formatted_price || formatCurrency(it.price)}</p>
                  <div className="mt-2">
                    <QuantityInput
                      value={it.quantity}
                      onChange={(q) => updateQuantity(it.id, q)}
                      min={1}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button variant="ghost" onClick={() => removeFromCart(it.id)}>
                    Remover
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <SheetFooter>
          <div className="w-full flex items-center justify-between">
            <div className="text-sm text-gray-600">Subtotal: {formatCurrency(subtotal)}</div>
            <Button>Finalizar Compra</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}