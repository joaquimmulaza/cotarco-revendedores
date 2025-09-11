import { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook customizado para gerenciar dados de parceiros
 * @param {string} status - Status dos parceiros a buscar
 * @param {number} page - Página atual para paginação
 * @param {boolean} isAdmin - Se o usuário é admin
 * @param {boolean} authLoading - Se a autenticação está carregando
 * @returns {Object} { partners, pagination, loading, error, refetch }
 */
export const usePartners = (status, page, isAdmin, authLoading) => {
  // Estados para gestão de dados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partners, setPartners] = useState([]);
  const [pagination, setPagination] = useState(null);
  
  // Ref para cancelar requisições pendentes
  const abortControllerRef = useRef(null);
  
  // Ref para track do último status/page requisitado
  const lastRequestRef = useRef({ status: null, page: null });

  // fetchPartners usando useCallback para estabilizar a referência
  const fetchPartners = useCallback(async () => {
    // Só buscar dados se o usuário for admin e não estiver carregando
    if (!isAdmin || authLoading) {
      console.log(`[usePartners] Skipping fetch - isAdmin: ${isAdmin}, authLoading: ${authLoading}`);
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController para esta requisição
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError('');
      
      console.log(`[usePartners] Fetching partners - Status: ${status}, Page: ${page}`);
      
      // Track da requisição atual
      lastRequestRef.current = { status, page };
      
      const response = await adminService.getPartners(status, page);
      
      // Verificar se esta ainda é a requisição mais recente
      if (lastRequestRef.current.status === status && lastRequestRef.current.page === page) {
        setPartners(response.partners || []);
        setPagination(response.pagination || null);
        console.log(`[usePartners] Successfully loaded ${(response.partners || []).length} partners for status '${status}', page ${page}`);
      } else {
        console.log(`[usePartners] Discarding stale response for status '${status}', page ${page}`);
      }
      
    } catch (error) {
      // Ignorar erros de cancelamento
      if (error.name === 'AbortError') {
        console.log(`[usePartners] Request aborted for status '${status}', page ${page}`);
        return;
      }
      
      console.error('Erro ao carregar parceiros:', error);
      
      // Só mostrar erro se esta ainda é a requisição mais recente
      if (lastRequestRef.current.status === status && lastRequestRef.current.page === page) {
        const errorMessage = error.message || 'Erro ao carregar dados';
        setError(errorMessage);
        setPartners([]); // Limpar dados antigos em caso de erro
        setPagination(null);
        toast.error(errorMessage);
      }
    } finally {
      // Só parar loading se esta ainda é a requisição mais recente
      if (lastRequestRef.current.status === status && lastRequestRef.current.page === page) {
        setLoading(false);
      }
    }
  }, [status, page, isAdmin, authLoading]);

  // Effect para carregar dados quando os parâmetros mudarem
  useEffect(() => {
    console.log(`[usePartners] useEffect triggered - Status: ${status}, Page: ${page}, IsAdmin: ${isAdmin}, AuthLoading: ${authLoading}`);
    
    // Reset estado quando mudar de status (nova tab)
    if (lastRequestRef.current.status !== status) {
      console.log(`[usePartners] Status changed from '${lastRequestRef.current.status}' to '${status}', resetting state`);
      setPartners([]);
      setPagination(null);
      setError('');
    }
    
    fetchPartners();

    // Cleanup: cancelar requisição ao desmontar ou quando dependências mudarem
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchPartners]);

  // Função refetch que mantém os parâmetros atuais
  const refetch = useCallback(() => {
    console.log(`[usePartners] Manual refetch requested for status '${status}', page ${page}`);
    fetchPartners();
  }, [fetchPartners]);

  return {
    partners,
    pagination,
    loading,
    error,
    refetch
  };
};