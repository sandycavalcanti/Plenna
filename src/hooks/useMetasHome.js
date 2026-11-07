import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';
import { normalizarRespostaMetas } from '../utils/metaContract';

export function useMetasHome() {
  const [state, setState] = useState({ metas: [], loading: true, error: false });
  const request = useRef(0);
  const detach = useRef(() => {});
  const refresh = useCallback(async () => {
    const id = ++request.current;
    detach.current();
    setState({ metas: [], loading: true, error: false });
    try {
      const session = await tokenStorage.captureSession();
      if (id !== request.current) return;
      if (!session) throw new Error('SESSION_REQUIRED');
      const invalidate = () => {
        if (id !== request.current) return;
        request.current++;
        setState({ metas: [], loading: false, error: true });
      };
      session.signal.addEventListener('abort', invalidate, { once: true });
      detach.current = () => session.signal.removeEventListener('abort', invalidate);
      tokenStorage.assertSession(session.id);
      const response = await apiClient.get('/metas', { signal: session.signal, rf017SessionId: session.id });
      tokenStorage.assertSession(session.id);
      const metas = normalizarRespostaMetas(response.data).map((metaApi) => {
        return {
          id: metaApi.meta_id,
          nome: metaApi.meta_titulo,
          valor: metaApi.meta_valor,
          valorReservado: metaApi.meta_valor_reservado,
          progressoPercentual: metaApi.progresso_percentual,
          valorRestante: metaApi.valor_restante,
          data: metaApi.meta_data,
          concluida: metaApi.meta_completado,
        };
      });
      if (id === request.current) setState({ metas, loading: false, error: false });
    } catch {
      if (id === request.current) setState({ metas: [], loading: false, error: true });
    }
  }, []);
  useFocusEffect(useCallback(() => {
    refresh();
    return () => { request.current++; detach.current(); };
  }, [refresh]));
  return { ...state, refresh };
}
