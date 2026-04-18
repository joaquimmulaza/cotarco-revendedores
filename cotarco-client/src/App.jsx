import { createBrowserRouter, RouterProvider } from 'react-router-dom';

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

// Import Layouts
import AdminLayout from './components/layouts/AdminLayout';
import PartnerLayout from './components/layouts/PartnerLayout';

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
    {
      path: "/email/verify/:id/:hash",
      element: <EmailValidated />
    },
    {
      element: (
        <ProtectedRoute>
          <PartnerLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/dashboard",
          element: <Dashboard />
        },
        {
          path: "/checkout",
          element: <CheckoutPage />
        }
      ]
    },
    {
      path: "/admin/login",
      element: <AdminLogin />
    },
    {
      element: (
        <ProtectedRoute adminOnly={true}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/admin/dashboard/*",
          element: <AdminDashboard />
        }
      ]
    }
  ], {
    basename: '/distribuidores'
  });

  return (
    <div className="App">
      <Toaster richColors position="top-right" closeButton />
      <RouterProvider router={router} />
    </div>
  );
}

export default AppContent;
