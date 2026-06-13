import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { CatchError } from '../api/constants';

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
      CatchError(error);
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
      CatchError(error);
      return { compras: [], itens: [] };
    }
  }, []);

  // Buscar tempo de uso
  const fetchTempoUso = useCallback(async () => {
    try {
      const response = await apiClient.get('/tempo-uso');
      return response.data;
    } catch (error) {
      CatchError(error);
      return [];
    }
  }, []);

  // Buscar gastos por categoria
  const fetchGastosCategoria = useCallback(async () => {
    try {
      const response = await apiClient.get('/dashboard/gastos-categoria');
      return response.data;
    } catch (error) {
      CatchError(error);
      return [];
    }
  }, []);

  // Buscar impulsividade
  const fetchImpulsividade = useCallback(async () => {
    try {
      const response = await apiClient.get('/dashboard/impulsividade');
      return response.data;
    } catch (error) {
      CatchError(error);
      return null;
    }
  }, []);

  // Buscar gastos por forma de pagamento
  const fetchGastosFormaPagamento = useCallback(async () => {
    try {
      const response = await apiClient.get('/dashboard/gastos-forma-pagamento');
      return response.data;
    } catch (error) {
      CatchError(error);
      return null;
    }
  }, []);

  // Buscar limite de compras
  const fetchLimiteCompra = useCallback(async () => {
    try {
      const response = await apiClient.get('/dashboard/limite-compras');
      return response.data;
    } catch (error) {
      CatchError(error);
      return null;
    }
  }, []);

  // Buscar metas
  const fetchMetas = useCallback(async () => {
    try {
      const response = await apiClient.get('/goals');
      return response.data;
    } catch (error) {
      CatchError(error);
      return [];
    }
  }, []);

  // Buscar preferências
  const fetchPreferencias = useCallback(async () => {
    try {
      const response = await apiClient.get('/preferencia');
      return response.data;
    } catch (error) {
      CatchError(error);
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
