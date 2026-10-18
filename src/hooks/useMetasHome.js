import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';

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
      const response = await apiClient.get('/goals', { signal: session.signal, rf017SessionId: session.id });
      tokenStorage.assertSession(session.id);
      if (!Array.isArray(response.data)) throw new Error('INVALID_GOALS');
      const ids = new Set();
      const metas = response.data.map(g => {
        if (!Number.isInteger(g.meta_id) || g.meta_id <= 0 || ids.has(g.meta_id) || typeof g.meta_titulo !== 'string' || !g.meta_titulo.trim() || typeof g.meta_completado !== 'boolean') throw new Error('INVALID_GOALS');
        ids.add(g.meta_id);
        return { id: g.meta_id, nome: g.meta_titulo, valor: g.meta_valor, data: g.meta_data, concluida: g.meta_completado };
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
