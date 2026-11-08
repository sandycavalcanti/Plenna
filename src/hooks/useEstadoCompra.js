import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';
export function useEstadoCompra(compraId, refreshKey) {
  const [state, setState] = useState({ data: null, loading: true, error: false });
  useEffect(() => {
    let active = true,
      session,
      clear;
    const update = next => setState({ compraId, refreshKey, ...next });
    update({ data: null, loading: true, error: false });
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!active) return;
        if (!session) { update({ data: null, loading: false, error: true }); return; }
        tokenStorage.assertSession(session.id);
        clear = () => {
          active = false;
          update({ data: null, loading: false, error: false });
        };
        session.signal.addEventListener('abort', clear, { once: true });
        const r = await apiClient.get(`/v2/compras/${compraId}/eventos`, {
          params: {compacto:'1'},
          signal: session.signal,
          usageMonitoringSessionId: session.id,
        });
        tokenStorage.assertSession(session.id);
        if (r.data?.versaoContrato !== 1 || r.data.compraId !== compraId ||
          r.data.disponivel !== true || !r.data.resumo || !Array.isArray(r.data.eventos)) {
          throw Error('INVALID_EVENT_CONTRACT');
        }
        if (active) update({ data: r.data, loading: false, error: false });
      } catch {
        if (active && !session?.signal.aborted) update({ data: null, loading: false, error: true });
      }
    })();
    return () => {
      active = false;
      session?.signal.removeEventListener('abort', clear);
    };
  }, [compraId, refreshKey]);
  return state.compraId === compraId && state.refreshKey === refreshKey
    ? state : { data: null, loading: true, error: false };
}
