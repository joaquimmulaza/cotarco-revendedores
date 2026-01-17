import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CheckoutPage from '../pages/CheckoutPage';
import { CartProvider } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

// Mock API
vi.mock('../services/api', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    partner_profile: {
        company_name: 'Test Company',
    },
};

const mockCartItems = [
    {
        id: 1,
        name: 'Test Product',
        price: 1000,
        quantity: 2,
        images: [{ src: 'https://example.com/image.jpg' }],
    },
];

const renderCheckoutPage = (cartItems = mockCartItems) => {
    const mockCartValue = {
        items: cartItems,
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        addToCart: vi.fn(),
        updateQuantity: vi.fn(),
        removeFromCart: vi.fn(),
        clearCart: vi.fn(),
    };

    return render(
        <BrowserRouter>
            <AuthContext.Provider value={{ user: mockUser }}>
                <CartProvider value={mockCartValue}>
                    <CheckoutPage />
                </CartProvider>
            </AuthContext.Provider>
        </BrowserRouter>
    );
};

describe('Checkout Flow Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.ResizeObserver = vi.fn().mockImplementation(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        }));
    });

    it('should render checkout form', () => {
        renderCheckoutPage();

        expect(screen.getByText(/Checkout/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Endereço/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Cidade/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
    });

    it('should show validation errors for empty fields', async () => {
        const user = userEvent.setup();
        renderCheckoutPage();

        const submitButton = screen.getByRole('button', { name: /Finalizar Encomenda/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/O endereço é obrigatório/i)).toBeInTheDocument();
            expect(screen.getByText(/A cidade é obrigatória/i)).toBeInTheDocument();
            expect(screen.getByText(/O telefone é obrigatório/i)).toBeInTheDocument();
        });
    });

    it('should submit checkout and show payment reference', async () => {
        const user = userEvent.setup();

        api.post.mockResolvedValueOnce({
            data: {
                entity: '12345',
                reference: '999888777',
                amount: 2000,
            },
        });

        renderCheckoutPage();

        // Fill form
        await user.type(screen.getByLabelText(/Endereço/i), '123 Test St');
        await user.type(screen.getByLabelText(/Cidade/i), 'Luanda');
        await user.type(screen.getByLabelText(/Telefone/i), '923456789');

        // Submit
        const submitButton = screen.getByRole('button', { name: /Finalizar Encomenda/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/orders/create-payment', expect.any(Object));
            expect(screen.getByText(/Pagamento Gerado com Sucesso/i)).toBeInTheDocument();
            expect(screen.getByText('12345')).toBeInTheDocument();
            expect(screen.getByText('999888777')).toBeInTheDocument();
        });
    });


});
