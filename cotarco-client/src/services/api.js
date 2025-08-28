import axios from 'axios';
import { config as appConfig } from '../config/config';

// Configuração base da API
const API_BASE_URL = appConfig.API_BASE_URL;

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Importante para cookies de sessão
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(appConfig.AUTH.TOKEN_KEY);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Verificar se é um erro de login (não deve redirecionar automaticamente)
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.includes('/login') || currentPath.includes('/admin/login');
      
      // Se estiver numa página de login, não redirecionar (deixar o componente tratar o erro)
      if (isLoginPage) {
        return Promise.reject(error);
      }
      
      // Token expirado ou inválido - redirecionar para login apropriado
      localStorage.removeItem(appConfig.AUTH.TOKEN_KEY);
      localStorage.removeItem(appConfig.AUTH.USER_KEY);
      
      // Detectar contexto atual para redirecionar corretamente
      let redirectPath = appConfig.ROUTES.LOGIN; // padrão
      
      // Se estiver em contexto de admin, redirecionar para login de admin
      if (currentPath.includes('/admin')) {
        redirectPath = appConfig.ROUTES.ADMIN_LOGIN;
      }
      
      window.location.href = redirectPath;
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  // Login de revendedor
  async loginRevendedor(credentials) {
    try {
      const response = await api.post('/login', credentials);
      if (response.data.token) {
        localStorage.setItem(appConfig.AUTH.TOKEN_KEY, response.data.token);
        localStorage.setItem(appConfig.AUTH.USER_KEY, JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Erro detalhado no login:', error);
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.message) {
        throw { message: error.message };
      } else {
        throw { message: 'Erro ao fazer login. Verifique a conexão com o servidor.' };
      }
    }
  },

  // Login de administrador
  async loginAdmin(credentials) {
    try {
      const response = await api.post('/admin/login', credentials);
      if (response.data.token) {
        localStorage.setItem(appConfig.AUTH.TOKEN_KEY, response.data.token);
        localStorage.setItem(appConfig.AUTH.USER_KEY, JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Erro detalhado no login de administrador:', error);
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.message) {
        throw { message: error.message };
      } else {
        throw { message: 'Erro ao fazer login de administrador. Verifique a conexão com o servidor.' };
      }
    }
  },

  // Registro de revendedor
  async registerRevendedor(userData) {
    try {
      const isFormData = typeof FormData !== 'undefined' && userData instanceof FormData;
      const response = await api.post('/register', userData, isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : undefined);
      return response.data;
    } catch (error) {
      console.error('Erro detalhado no registro:', error);
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.message) {
        throw { message: error.message };
      } else {
        throw { message: 'Erro ao registrar revendedor. Verifique a conexão com o servidor.' };
      }
    }
  },

  // Logout
  async logout() {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem(appConfig.AUTH.TOKEN_KEY);
      localStorage.removeItem(appConfig.AUTH.USER_KEY);
    }
  },

  // Verificar se está autenticado
  isAuthenticated() {
    return !!localStorage.getItem(appConfig.AUTH.TOKEN_KEY);
  },

  // Obter usuário atual
  getCurrentUser() {
    const user = localStorage.getItem(appConfig.AUTH.USER_KEY);
    return user ? JSON.parse(user) : null;
  }
};

// Serviços de administração
export const adminService = {
  // Obter revendedores com filtros e paginação
  async getRevendedores(status = null, page = 1, perPage = 15) {
    try {
      let url = `/admin/revendedores?page=${page}&per_page=${perPage}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter revendedores' };
    }
  },

  // Atualizar status de um revendedor
  async updateRevendedorStatus(userId, status) {
    try {
      const response = await api.put(`/admin/revendedores/${userId}/status`, {
        status: status
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao atualizar status do revendedor' };
    }
  },

  // Obter estatísticas do dashboard
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard-stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter estatísticas do dashboard' };
    }
  },

  // === FUNÇÕES ANTIGAS MANTIDAS PARA COMPATIBILIDADE ===
  
  // @deprecated Use getRevendedores('pending_approval') instead
  async getPendingRevendedores() {
    try {
      const response = await api.get('/admin/revendedores/pending');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter revendedores pendentes' };
    }
  },

  // @deprecated Use updateRevendedorStatus(userId, 'active') instead
  async approveRevendedor(userId) {
    try {
      const response = await api.post(`/admin/revendedores/${userId}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao aprovar revendedor' };
    }
  },

  // @deprecated Use updateRevendedorStatus(userId, 'rejected') instead
  async rejectRevendedor(userId) {
    try {
      const response = await api.post(`/admin/revendedores/${userId}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao rejeitar revendedor' };
    }
  },

  // Obter URL do alvará para visualização/download
  getAlvaraUrl(userId) {
    const token = localStorage.getItem(appConfig.AUTH.TOKEN_KEY);
    return `${appConfig.API_BASE_URL}/admin/revendedores/${userId}/alvara?token=${token}`;
  },

  // Visualizar alvará (abrir em nova aba)
  viewAlvara(userId) {
    const url = this.getAlvaraUrl(userId);
    window.open(url, '_blank');
  },

  // === GESTÃO DE FICHEIROS DE STOCK ===
  
  // Obter ficheiro de stock atual (admin)
  async getCurrentStockFile() {
    try {
      const response = await api.get('/admin/stock-file/current');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter ficheiro de stock atual' };
    }
  },

  // Upload ou substituir ficheiro de stock (admin)
  async uploadStockFile(formData) {
    try {
      const response = await api.post('/admin/stock-file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao carregar ficheiro de stock' };
    }
  },

  // Ativar/desativar ficheiro de stock (admin)
  async toggleStockFileStatus(fileId) {
    try {
      const response = await api.patch(`/admin/stock-file/${fileId}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao alterar status do ficheiro' };
    }
  },

  // Apagar ficheiro de stock (admin)
  async deleteStockFile(fileId) {
    try {
      const response = await api.delete(`/admin/stock-file/${fileId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao apagar ficheiro de stock' };
    }
  }
};

// Serviços para revendedores
export const revendedorService = {
  // Obter informações do ficheiro de stock disponível
  async getStockFileInfo() {
    try {
      const response = await api.get('/revendedor/stock-file/info');
      return response.data;
    } catch (error) {
      // Se for 404, retornar null para indicar que não há ficheiro disponível
      if (error.response?.status === 404) {
        return { file: null };
      }
      throw error.response?.data || { message: 'Erro ao obter informações do ficheiro de stock' };
    }
  },

  // Obter URL para download do ficheiro de stock
  getStockFileDownloadUrl() {
    const token = localStorage.getItem(appConfig.AUTH.TOKEN_KEY);
    return `${appConfig.API_BASE_URL}/revendedor/stock-file/download?token=${token}`;
  },

  // Fazer download do ficheiro de stock (abrir em nova aba/download)
  downloadStockFile() {
    const url = this.getStockFileDownloadUrl();
    window.open(url, '_blank');
  }
};

export default api;
