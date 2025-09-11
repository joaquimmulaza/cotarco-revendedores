import { createBrowserRouter, RouterProvider, Routes, Route } from 'react-router-dom';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerificationPending from './pages/EmailVerificationPending';
import EmailValidated from './pages/EmailValidated';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ApiTestPage from './pages/ApiTestPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Import components
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

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
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )
    },
    {
      path: "/admin/login",
      element: <AdminLogin />
    },
    {
      path: "/admin/dashboard",
      element: (
        <ProtectedRoute adminOnly={true}>
          <AdminDashboard />
        </ProtectedRoute>
      )
    }
  ], {
    basename: import.meta.env.VITE_APP_BASE_URL || '/'
  });

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
