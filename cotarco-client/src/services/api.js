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
  // Não usar cookies de sessão; usamos Bearer Token do Sanctum
  withCredentials: false,
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
      
      // Verificar se há um token válido no localStorage antes de fazer logout
      const token = localStorage.getItem(appConfig.AUTH.TOKEN_KEY);
      if (!token) {
        // Não há token, então não faz sentido tentar redirecionar
        return Promise.reject(error);
      }
      
      // Verificar se a resposta contém uma mensagem específica de token inválido
      const errorMessage = error.response?.data?.message || '';
      const isTokenError = errorMessage.toLowerCase().includes('token') || 
                          errorMessage.toLowerCase().includes('unauthenticated') ||
                          errorMessage.toLowerCase().includes('não autenticado');
      
      // Só fazer logout automático se for realmente um erro de token
      if (isTokenError) {
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

  // Obter usuário atual do localStorage
  getCurrentUser() {
    const user = localStorage.getItem(appConfig.AUTH.USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Buscar dados do utilizador autenticado do servidor
  async getAuthenticatedUser() {
    try {
      const response = await api.get('/user');
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter dados do utilizador' };
    }
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

  // Atualizar parceiro (role e business_model)
  async updatePartner(userId, partnerData) {
    try {
      const response = await api.put(`/admin/partners/${userId}`, partnerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao atualizar parceiro' };
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

  // Fazer download do ficheiro de stock
  async downloadStockFile() {
    try {
      const token = localStorage.getItem(appConfig.AUTH.TOKEN_KEY);
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Fazer requisição para download usando fetch
      const response = await fetch(`${appConfig.API_BASE_URL}/revendedor/stock-file/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json, application/octet-stream',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro no download' }));
        throw new Error(errorData.message || 'Erro ao fazer download do ficheiro');
      }

      // Obter o nome do ficheiro do header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'mapa-stock.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Converter resposta para blob
      const blob = await response.blob();
      
      // Criar URL temporário e fazer download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Erro no download:', error);
      throw error;
    }
  }
};

export default api;
