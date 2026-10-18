import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';
import { observarAtualizacaoTempoUso } from '../utils/tempoUsoAtualizacao';
export function useTempoUsoHome(enabled) {
  const [state, setState] = useState({ estado: 'NAO_SOLICITADO', registros: [] });
  const request = useRef(0);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    const id = ++request.current;
    setState({ estado: 'CARREGANDO', registros: [] });
    try {
      const session = await tokenStorage.captureSession();
      if (!session) throw new Error('SESSION_REQUIRED');
      const config = { signal: session.signal, rf017SessionId: session.id };
      const { data } = await apiClient.get('/consentimento', config);
      tokenStorage.assertSession(session.id);
      if (!Array.isArray(data)) throw new Error('INVALID_CONTRACT');
      const allowed = data.some(c => (c.consentimento_tipo_codigo ?? c.tb_consentimento_tipo?.consentimento_tipo_codigo) === 'MONITORAMENTO_TEMPO_USO' && c.consentimento_status === true);
      if (!allowed) { if (id === request.current) setState({ estado: 'SEM_CONSENTIMENTO', registros: [] }); return; }
      const response = await apiClient.get('/tempo-uso', config);
      tokenStorage.assertSession(session.id);
      if (!Array.isArray(response.data)) throw new Error('INVALID_CONTRACT');
      if (id === request.current) setState({ estado: 'DISPONIVEL', registros: response.data });
    } catch { if (id === request.current) setState({ estado: 'ERRO', registros: [] }); }
  }, [enabled]);
  useFocusEffect(useCallback(() => { refresh(); const unsubscribe = enabled ? observarAtualizacaoTempoUso(refresh) : () => {}; return () => { request.current++; unsubscribe(); }; }, [refresh, enabled]));
  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    let disposed = false; let captured;
    const clear = () => { request.current++; setState({ estado: 'NAO_SOLICITADO', registros: [] }); };
    tokenStorage.captureSession().then(session => {
      if (disposed) return;
      captured = session;
      if (!session || session.signal.aborted) clear();
      else session.signal.addEventListener('abort', clear);
    }).catch(() => { if (!disposed) clear(); });
    return () => { disposed = true; captured?.signal.removeEventListener('abort', clear); };
  }, [enabled]));
  return { ...(enabled ? state : { estado: 'NAO_SOLICITADO', registros: [] }), refresh };
}
