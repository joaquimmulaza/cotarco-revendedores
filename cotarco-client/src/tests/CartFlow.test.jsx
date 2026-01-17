import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
    },
}));

// Test component to interact with cart
function TestCartComponent() {
    const { items, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, subtotal } = useCart();

    return (
        <div>
            <div data-testid="total-items">{totalItems}</div>
            <div data-testid="subtotal">{subtotal}</div>
            <div data-testid="items-count">{items.length}</div>

            <button
                onClick={() => addToCart({ id: 1, name: 'Test Product', price: 100 }, 2)}
                data-testid="add-item-btn"
            >
                Add Item
            </button>

            <button
                onClick={() => updateQuantity(1, 5)}
                data-testid="update-quantity-btn"
            >
                Update Quantity
            </button>

            <button
                onClick={() => removeFromCart(1)}
                data-testid="remove-item-btn"
            >
                Remove Item
            </button>

            <button
                onClick={() => clearCart()}
                data-testid="clear-cart-btn"
            >
                Clear Cart
            </button>
        </div>
    );
}

describe('Cart Flow Tests', () => {
    it('should add item to cart', async () => {
        const user = userEvent.setup();

        render(
            <CartProvider>
                <TestCartComponent />
            </CartProvider>
        );

        const addButton = screen.getByTestId('add-item-btn');
        await user.click(addButton);

        await waitFor(() => {
            expect(screen.getByTestId('total-items').textContent).toBe('2');
            expect(screen.getByTestId('subtotal').textContent).toBe('200');
            expect(screen.getByTestId('items-count').textContent).toBe('1');
        });

        expect(toast.success).toHaveBeenCalledWith('2 x "Test Product" adicionados ao carrinho');
    });

    it('should update item quantity', async () => {
        const user = userEvent.setup();

        render(
            <CartProvider>
                <TestCartComponent />
            </CartProvider>
        );

        // First add an item
        const addButton = screen.getByTestId('add-item-btn');
        await user.click(addButton);

        // Then update quantity
        const updateButton = screen.getByTestId('update-quantity-btn');
        await user.click(updateButton);

        await waitFor(() => {
            expect(screen.getByTestId('total-items').textContent).toBe('5');
            expect(screen.getByTestId('subtotal').textContent).toBe('500');
        });
    });

    it('should remove item from cart', async () => {
        const user = userEvent.setup();

        render(
            <CartProvider>
                <TestCartComponent />
            </CartProvider>
        );

        // Add item
        const addButton = screen.getByTestId('add-item-btn');
        await user.click(addButton);

        // Remove item
        const removeButton = screen.getByTestId('remove-item-btn');
        await user.click(removeButton);

        await waitFor(() => {
            expect(screen.getByTestId('total-items').textContent).toBe('0');
            expect(screen.getByTestId('subtotal').textContent).toBe('0');
            expect(screen.getByTestId('items-count').textContent).toBe('0');
        });
    });

    it('should clear entire cart', async () => {
        const user = userEvent.setup();

        render(
            <CartProvider>
                <TestCartComponent />
            </CartProvider>
        );

        // Add item
        const addButton = screen.getByTestId('add-item-btn');
        await user.click(addButton);

        // Clear cart
        const clearButton = screen.getByTestId('clear-cart-btn');
        await user.click(clearButton);

        await waitFor(() => {
            expect(screen.getByTestId('total-items').textContent).toBe('0');
            expect(screen.getByTestId('items-count').textContent).toBe('0');
        });
    });

    it('should increment quantity when adding same item twice', async () => {
        const user = userEvent.setup();

        render(
            <CartProvider>
                <TestCartComponent />
            </CartProvider>
        );

        const addButton = screen.getByTestId('add-item-btn');
        await user.click(addButton);
        await user.click(addButton);

        await waitFor(() => {
            expect(screen.getByTestId('total-items').textContent).toBe('4'); // 2 + 2
            expect(screen.getByTestId('items-count').textContent).toBe('1'); // Still 1 unique item
        });
    });
});
