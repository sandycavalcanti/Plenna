import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';
export function useAnaliseComportamento(periodo) {
  const [state, setState] = useState({ periodo, dados: null, loading: true, error: false });
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++request.current;
    setState({ periodo, dados: null, loading: true, error: false });
    try {
      const session = await tokenStorage.captureSession();
      if (!session) throw new Error('SESSION_REQUIRED');
      const { data } = await apiClient.get('/analises/comportamento', { params: { periodo }, signal: session.signal, rf017SessionId: session.id });
      tokenStorage.assertSession(session.id);
      if (data?.versaoContrato !== 1 || data?.analise?.periodo !== periodo || !data.analise.indicadores || !Array.isArray(data?.recomendacoes?.recomendacoes)) throw new Error('ANALISE_CONTRACT_INVALID');
      if (id === request.current) setState({ periodo, dados: data, loading: false, error: false });
    } catch {
      if (id === request.current) setState({ periodo, dados: null, loading: false, error: true });
    }
  }, [periodo]);
  useFocusEffect(useCallback(() => { refresh(); return () => { request.current++; }; }, [refresh]));
  useFocusEffect(useCallback(() => {
    let disposed = false; let captured;
    const clear = () => { request.current++; setState({ periodo, dados: null, loading: false, error: true }); };
    tokenStorage.captureSession().then(session => {
      if (disposed) return;
      captured = session;
      if (!session || session.signal.aborted) clear();
      else session.signal.addEventListener('abort', clear);
    }).catch(() => { if (!disposed) clear(); });
    return () => { disposed = true; captured?.signal.removeEventListener('abort', clear); };
  }, [periodo]));
  return { ...(state.periodo === periodo ? state : { dados: null, loading: true, error: false }), refresh };
}
