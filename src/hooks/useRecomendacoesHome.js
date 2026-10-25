import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { listarRecomendacoes, atualizarStatusRecomendacao } from '../api/recomendacoes';

export function useRecomendacoesHome() {
  const [state, setState] = useState({ itens: [], loading: true, error: false, consentimentoAtivo: null });
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++request.current;
    setState((current) => ({ ...current, loading: true, error: false }));
    try {
      const result = await listarRecomendacoes({ limite: 10 });
      if (id !== request.current) return;
      if (!result || !Array.isArray(result.itens) || typeof result.consentimentoAtivo !== 'boolean') {
        throw new Error('RECOMENDACOES_CONTRACT_INVALID');
      }
      setState({ itens: result.itens, loading: false, error: false, consentimentoAtivo: result.consentimentoAtivo });
    } catch (error) {
      if (id !== request.current) return;
      if (error?.response?.status === 403) {
        setState({ itens: [], loading: false, error: false, consentimentoAtivo: false });
      } else {
        setState({ itens: [], loading: false, error: true, consentimentoAtivo: null });
      }
    }
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    await atualizarStatusRecomendacao(id, status);
    setState((current) => ({ ...current, itens: status === 'DESCARTADA'
      ? current.itens.filter((item) => item.id !== id)
      : current.itens.map((item) => item.id === id ? { ...item, status } : item) }));
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
    return () => { request.current += 1; };
  }, [refresh]));

  return { ...state, refresh, updateStatus };
}
