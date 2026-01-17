import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { authService } from '../services/api';

// Mock authService
vi.mock('../services/api', () => ({
    authService: {
        registerPartner: vi.fn(),
    },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderRegister = () => {
    return render(
        <BrowserRouter>
            <Register />
        </BrowserRouter>
    );
};

describe('Registration Flow Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render registration form', () => {
        renderRegister();

        expect(screen.getByText(/Criar conta/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nome da Empresa/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Palavra-passe$/)).toBeInTheDocument();
    });

    it('should show validation errors for empty fields', async () => {
        const user = userEvent.setup();
        renderRegister();

        const submitButton = screen.getByRole('button', { name: /Registar/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Nome completo é obrigatório/i)).toBeInTheDocument();
            expect(screen.getByText(/Email é obrigatório/i)).toBeInTheDocument();
        });
    });

    it('should show error when passwords do not match', async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.type(screen.getByLabelText(/^Palavra-passe$/i), 'Password123!');
        await user.type(screen.getByLabelText(/Confirmar palavra-passe/i), 'DifferentPassword');

        const submitButton = screen.getByRole('button', { name: /Registar/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/As palavras-passe não coincidem/i)).toBeInTheDocument();
        });
    });

    it('should submit registration successfully', async () => {
        const user = userEvent.setup();

        authService.registerPartner.mockResolvedValueOnce({
            message: 'Registration successful',
        });

        renderRegister();

        // Fill form
        await user.type(screen.getByLabelText(/Nome completo/i), 'Test Partner');
        await user.type(screen.getByLabelText(/Email/i), 'partner@test.com');
        await user.type(screen.getByLabelText(/Telefone/i), '923456789');
        await user.type(screen.getByLabelText(/Nome da Empresa/i), 'Test Company');
        await user.type(screen.getByLabelText(/^Palavra-passe$/), 'password123'); // Exact match
        await user.type(screen.getByLabelText(/Confirmar palavra-passe/i), 'password123');

        // Mock file upload
        const file = new File(['dummy content'], 'alvara.pdf', { type: 'application/pdf' });
        const fileInput = screen.getByLabelText(/Alvará/i);
        await user.upload(fileInput, file);

        // Submit
        const submitButton = screen.getByRole('button', { name: /Registar/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(authService.registerPartner).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/email-verification-pending');
        });
    });


});
