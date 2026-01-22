import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from './ProductCard';
import { vi } from 'vitest';

// Mock the cart context
const mockAddToCart = vi.fn();
vi.mock('../contexts/CartContext', () => ({
    useCart: () => ({
        addToCart: mockAddToCart,
    }),
}));

// Mock ColorSwatch and ButtonSwatch
vi.mock('./swatches/ColorSwatch', () => ({ default: () => <div data-testid="color-swatch">ColorSwatch</div> }));
vi.mock('./swatches/ButtonSwatch', () => ({ default: () => <div data-testid="button-swatch">ButtonSwatch</div> }));

describe('ProductCard', () => {
    const mockProductInstock = {
        id: 1,
        name: 'Test Product',
        sku: 'SKU-001',
        price: '1000',
        formatted_price: '1.000 Kz',
        stock_status: 'instock',
        attributes: [],
        variations: [],
        image_url: 'http://example.com/image.jpg',
    };

    const mockProductOutofstock = {
        id: 2,
        name: 'Out of Stock Product',
        sku: 'SKU-002',
        price: '2000',
        formatted_price: '2.000 Kz',
        stock_status: 'outofstock',
        attributes: [],
        variations: [],
        image_url: 'http://example.com/image2.jpg',
    };

    beforeEach(() => {
        mockAddToCart.mockClear();
    });

    it('renders "Adicionar" button when product is in stock', () => {
        render(<ProductCard product={mockProductInstock} />);

        // Check for badge text
        expect(screen.getByText('Em stock')).toBeInTheDocument();

        // Check for Add button
        const addButton = screen.getByRole('button', { name: /adicionar/i });
        expect(addButton).toBeInTheDocument();

        // Click button
        fireEvent.click(addButton);
        expect(mockAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 1);
    });

    it('does NOT render "Adicionar" button when product is out of stock', () => {
        render(<ProductCard product={mockProductOutofstock} />);

        // Check for badge text
        expect(screen.getByText('Fora de stock')).toBeInTheDocument();

        // Check for Add button absence
        const addButton = screen.queryByRole('button', { name: /adicionar/i });
        expect(addButton).not.toBeInTheDocument();
    });
});
