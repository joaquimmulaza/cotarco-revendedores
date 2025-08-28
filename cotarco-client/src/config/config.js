// Configurações da aplicação
export const config = {
  // URL da API (usando proxy do Vite em desenvolvimento)
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api',
  
  // Nome da aplicação
  APP_NAME: 'Cotarco Revendedores',
  
  // Configurações de autenticação
  AUTH: {
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'user',
  },
  
  // URLs das páginas
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    ADMIN_LOGIN: '/admin/login',
    ADMIN_DASHBOARD: '/admin/dashboard',
    DASHBOARD: '/dashboard',
    EMAIL_VERIFICATION_PENDING: '/email-verification-pending',
    EMAIL_VALIDATED: '/email-validated',
    API_TEST: '/api-test',
  },
};

export default config;
