import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { logApiErrors } from '../utils/error';

/**
 * Custom hook para gerenciar requisições de dados com refetch
 * Centraliza a lógica de busca de dados para reutilização entre telas
 */
export function useDataRefresh() {
  const [loading, setLoading] = useState(false);

  // Buscar dados do usuário
  const fetchUsuario = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/user');
      return response.data;
    } catch (error) {
      logApiErrors(error, 'Erro ao buscar dados do usuário');
      return null;
    }
  }, []);

  // Buscar compras com itens
  const fetchCompras = useCallback(async () => {
    try {
      const response = await apiClient.get('/compras');
      const data = response.data || [];
      const items = data.flatMap((c) => (Array.isArray(c.tb_compra_item) ? c.tb_compra_item.map((item) => ({ ...item, compra_id: c.compra_id })) : []));
      return { compras: data, itens: items };
    } catch (error) {
      logApiErrors(error, 'Erro ao buscar compras');
      return { compras: [], itens: [] };
    }
  }, []);

  // Buscar tempo de uso
  const fetchTempoUso = useCallback(async (options = {}) => {
    try {
      const response = await apiClient.get('/tempo-uso');
      return response.data;
    } catch (error) {
      console.error('TEMPO_USO_FETCH_FAILED');
      if (options.throwOnError) throw error;
      return [];
    }
  }, []);

  // Buscar gastos por categoria
  const fetchGastosCategoria = useCallback(async (periodo, options = {}) => {
    try {
      const response = await apiClient.get('/dashboard/gastos-categoria', { params: { periodo } });
      return response.data;
    } catch (error) {
      logApiErrors(error, 'Erro ao buscar gastos por categoria');
      if (options.throwOnError) throw error;
      return [];
    }
  }, []);

  // Buscar impulsividade
  const fetchImpulsividade = useCallback(async (periodo, options = {}) => {
    try {
      const response = await apiClient.get('/dashboard/impulsividade', { params: { periodo } });
      return response.data;
    } catch (error) {
      logApiErrors(error, 'Erro ao buscar impulsividade');
      if (options.throwOnError) throw error;
      return null;
    }
  }, []);

  // Buscar gastos por forma de pagamento
  const fetchGastosFormaPagamento = useCallback(async (periodo, options = {}) => {
    try {
      const response = await apiClient.get('/dashboard/gastos-forma-pagamento', { params: { periodo } });
      return response.data;
    } catch (error) {
      logApiErrors(error, 'Erro ao buscar gastos por forma de pagamento');
      if (options.throwOnError) throw error;
      return null;
    }
  }, []);

  // Buscar limite de compras
  const fetchLimiteCompra = useCallback(async (periodo, options = {}) => {
    try {
      const response = await apiClient.get('/dashboard/limite-compras', { params: { periodo } });
      return response.data;
    } catch (error) {
      logApiErrors(error, 'Erro ao buscar limite de compras');
      if (options.throwOnError) throw error;
      return null;
    }
  }, []);

  // Buscar metas
  const fetchMetas = useCallback(async () => {
    try {
      const response = await apiClient.get('/goals');
      return response.data;
    } catch (error) {
      logApiErrors(error, 'Erro ao buscar metas');
      return [];
    }
  }, []);

  // Buscar preferências
  const fetchPreferencias = useCallback(async () => {
    try {
      const response = await apiClient.get('/preferencia');
      return response.data;
    } catch (error) {
      logApiErrors(error, 'Erro ao buscar preferências');
      return [];
    }
  }, []);

  return {
    loading,
    setLoading,
    fetchUsuario,
    fetchCompras,
    fetchTempoUso,
    fetchGastosCategoria,
    fetchImpulsividade,
    fetchGastosFormaPagamento,
    fetchLimiteCompra,
    fetchMetas,
    fetchPreferencias,
  };
}
