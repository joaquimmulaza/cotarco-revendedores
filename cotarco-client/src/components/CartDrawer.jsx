import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export default function CartDrawer({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Meu Carrinho de Compras</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          <p>O seu carrinho está vazio.</p>
        </div>

        <SheetFooter>
          <div className="w-full flex items-center justify-between">
            <div className="text-sm text-gray-600">Subtotal: R$ 0,00</div>
            <Button>Finalizar Compra</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


