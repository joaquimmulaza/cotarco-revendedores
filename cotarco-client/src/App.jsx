import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerificationPending from './pages/EmailVerificationPending';
import EmailValidated from './pages/EmailValidated';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ApiTestPage from './pages/ApiTestPage';

// Import components
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, isAdminAuthenticated } = useAuth();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email-verification-pending" element={<EmailVerificationPending />} />
          <Route path="/email-validated" element={<EmailValidated />} />
          <Route path="/api-test" element={<ApiTestPage />} />
          
          {/* Rota protegida do revendedor */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo="/">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Rotas do admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute isAuthenticated={isAdminAuthenticated} redirectTo="/admin/login">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
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
