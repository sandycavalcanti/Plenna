import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';
export function useEstadoCompra(compraId, refreshKey) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let active = true,
      session,
      clear;
    setData(null);
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!session) return;
        clear = () => {
          active = false;
          setData(null);
        };
        session.signal.addEventListener('abort', clear, { once: true });
        const r = await apiClient.get(`/v2/compras/${compraId}/eventos`, {
          signal: session.signal,
          rf017SessionId: session.id,
        });
        tokenStorage.assertSession(session.id);
        if (
          active &&
          r.data?.versaoContrato === 1 &&
          r.data.compraId === compraId &&
          r.data.disponivel &&
          r.data.resumo
        )
          setData(r.data);
      } catch {}
    })();
    return () => {
      active = false;
      session?.signal.removeEventListener('abort', clear);
    };
  }, [compraId, refreshKey]);
  return data;
}
