import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';
export function useDescobertasResumo(periodo) {
  const [state, setState] = useState({ periodo, dados: null });
  const generation = useRef(0),
    detach = useRef(() => {});
  const refresh = useCallback(async () => {
    detach.current();
    const run = ++generation.current;
    setState({ periodo, dados: null });
    let session, clear;
    try {
      session = await tokenStorage.captureSession();
      if (!session) throw Error('SESSION_REQUIRED');
      clear = () => {
        if (run === generation.current) {
          generation.current++;
          setState({ periodo, dados: null });
        }
      };
      session.signal.addEventListener('abort', clear, { once: true });
      detach.current = () => session.signal.removeEventListener('abort', clear);
      tokenStorage.assertSession(session.id);
      const { data } = await apiClient.get('/analises/descobertas', {
        params: { periodo },
        signal: session.signal,
        rf017SessionId: session.id,
        timeout: 10000,
      });
      tokenStorage.assertSession(session.id);
      if (
        data?.versaoContrato !== 1 ||
        data.periodo !== periodo ||
        !Array.isArray(data.descobertas) ||
        data.descobertas.some(
          (d) =>
            d.periodo !== periodo ||
            !['REGISTRADO', 'DECLARADO'].includes(d.tipo) ||
            typeof d.informacao !== 'string' ||
            !Array.isArray(d.evidencias) ||
            !d.evidencias.length,
        )
      )
        throw Error('INVALID_DISCOVERIES');
      if (run === generation.current) setState({ periodo, dados: data });
    } catch {
      if (run === generation.current) setState({ periodo, dados: null });
    }
    // O encerramento da sessão também apaga os dados que já foram exibidos, além de cancelar a requisição.
    return () => session?.signal.removeEventListener('abort', clear);
  }, [periodo]);
  useFocusEffect(
    useCallback(() => {
      let cleanup,
        disposed = false;
      refresh().then((fn) => {
        if (disposed) fn?.();
        else cleanup = fn;
      });
      return () => {
        disposed = true;
        generation.current++;
        detach.current();
        cleanup?.();
        setState({ periodo, dados: null });
      };
    }, [refresh]),
  );
  return { dados: state.periodo === periodo ? state.dados : null, refresh };
}
