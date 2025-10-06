import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { toast } from 'sonner';

// Estado inicial do carrinho
const initialState = {
  items: [], // cada item: { id, name?, price?, quantity, ...rest }
};

// Reducer do carrinho
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, quantity = 1 } = action.payload || {};
      if (!item || typeof item.id === 'undefined') return state;

      const existingIndex = state.items.findIndex((it) => it.id === item.id);

      // Se já existir, incrementa a quantidade
      if (existingIndex !== -1) {
        const updatedItems = state.items.map((it, idx) =>
          idx === existingIndex
            ? { ...it, quantity: (it.quantity || 0) + (quantity || 1) }
            : it
        );
        return { ...state, items: updatedItems };
      }

      // Se não existir, adiciona com a quantidade especificada
      const newItem = { ...item, quantity: quantity || 1 };
      return { ...state, items: [...state.items, newItem] };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload || {};
      if (typeof id === 'undefined' || typeof quantity === 'undefined') return state;
      const updatedItems = state.items.map((it) =>
        it.id === id ? { ...it, quantity } : it
      );
      return { ...state, items: updatedItems };
    }

    case 'REMOVE_ITEM': {
      const { id } = action.payload || {};
      if (typeof id === 'undefined') return state;
      const filtered = state.items.filter((it) => it.id !== id);
      return { ...state, items: filtered };
    }

    default:
      return state;
  }
}

// Contexto do carrinho
const CartContext = createContext(null);

// Provider do carrinho
export function CartProvider({ children }) {
  const [cartState, dispatch] = useReducer(cartReducer, initialState);

  // Ações expostas
  const addToCart = (item, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { item, quantity } });
    const safeQuantity = Number(quantity) || 1;
    const name = item?.name || 'Produto';
    toast.success(`${safeQuantity} x "${name}" adicionado${safeQuantity > 1 ? 's' : ''} ao carrinho`);
  };

  const updateQuantity = (id, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });

  const removeFromCart = (id) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });

  // Valores calculados
  const { totalItems, subtotal } = useMemo(() => {
    const totals = cartState.items.reduce(
      (acc, it) => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        acc.totalItems += qty;
        acc.subtotal += price * qty;
        return acc;
      },
      { totalItems: 0, subtotal: 0 }
    );
    return totals;
  }, [cartState.items]);

  const value = useMemo(
    () => ({
      items: cartState.items,
      addToCart,
      updateQuantity,
      removeFromCart,
      totalItems,
      subtotal,
    }),
    [cartState.items, totalItems, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook customizado para usar o carrinho
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return ctx;
}

export default CartContext;


