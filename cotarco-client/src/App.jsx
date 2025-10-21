import { createBrowserRouter, RouterProvider, Routes, Route } from 'react-router-dom';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerificationPending from './pages/EmailVerificationPending';
import EmailValidated from './pages/EmailValidated';
import EmailVerificationError from './pages/EmailVerificationError';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ApiTestPage from './pages/ApiTestPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CheckoutPage from './pages/CheckoutPage';

// Import components
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';

function AppContent() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login />
    },
    {
      path: "/login",
      element: <Login />
    },
    {
      path: "/register",
      element: <Register />
    },
    {
      path: "/email-verification-pending",
      element: <EmailVerificationPending />
    },
    {
      path: "/email-validated",
      element: <EmailValidated />
    },
    {
      path: "/email-verification-error",
      element: <EmailVerificationError />
    },
    {
      path: "/api-test",
      element: <ApiTestPage />
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />
    },
    {
      path: "/reset-password",
      element: <ResetPassword />
    },
    // 🔥 ADICIONADA: Rota para verificação de email
    {
      path: "/email/verify/:id/:hash",
      element: <EmailValidated />
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )
    },
    {
      path: "/checkout",
      element: (
        <ProtectedRoute>
          <CheckoutPage />
        </ProtectedRoute>
      )
    },
    {
      path: "/admin/login",
      element: <AdminLogin />
    },
    {
      path: "/admin/dashboard/*",
      element: (
        <ProtectedRoute adminOnly={true}>
          <AdminDashboard />
        </ProtectedRoute>
      )
    }
  ], {
    // 🔥 CORRIGIDO: Usar basename fixo em vez de variável de ambiente
    basename: '/distribuidores'
  });

  return (
    <div className="App">
      <Toaster richColors position="top-right" />
      <RouterProvider router={router} />
    </div>
  );
}

export default AppContent
