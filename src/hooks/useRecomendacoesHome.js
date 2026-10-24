import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { listarRecomendacoes, atualizarStatusRecomendacao } from '../api/recomendacoes';

export function useRecomendacoesHome() {
  const [state, setState] = useState({ itens: [], loading: true, error: false, consentimentoAtivo: false });
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++request.current;
    setState((current) => ({ ...current, loading: true, error: false }));
    try {
      const result = await listarRecomendacoes({ limite: 10 });
      if (id !== request.current) return;
      setState({ itens: Array.isArray(result?.itens) ? result.itens : [], loading: false, error: false, consentimentoAtivo: result?.consentimentoAtivo === true });
    } catch {
      if (id === request.current) setState({ itens: [], loading: false, error: true, consentimentoAtivo: false });
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
