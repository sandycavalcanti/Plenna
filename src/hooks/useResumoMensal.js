import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { periodoMensalUTC } from '../utils/resumoFinanceiro';
export function useResumoMensal(periodo = periodoMensalUTC()) {
  const [state, setState] = useState({ periodo, resumo: null, loading: true, error: false });
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++request.current;
    setState({ periodo, resumo: null, loading: true, error: false });
    try {
      const response = await apiClient.get('/dashboard/resumo-mensal', { params: { periodo } });
      if (id === request.current) setState({ periodo, resumo: response.data, loading: false, error: false });
    } catch {
      if (id === request.current) setState({ periodo, resumo: null, loading: false, error: true });
    }
  }, [periodo]);
  useFocusEffect(useCallback(() => { refresh(); return () => { request.current++; }; }, [refresh]));
  return { ...(state.periodo === periodo ? state : { resumo: null, loading: true, error: false }), refresh };
}
