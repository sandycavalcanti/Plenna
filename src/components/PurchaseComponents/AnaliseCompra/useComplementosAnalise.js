import { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { validarHistoricoCompra } from '../../../services/historicoCompraService';
import { validarAnaliseAutomatica } from '../../../services/analiseAutomaticaService';
import { apresentarReferenciaComplementar } from './apresentacao';

// Consultas somente ao abrir o painel; nenhum resultado complementar modifica a avaliação.
export function useComplementosAnalise(compraId) {
  const [state, setState] = useState({
    loading: true,
    financeiro: null,
    historico: null,
    automatico: null
  });
  useEffect(() => {
    let active = true,
      session,
      clear;
    const controller = new AbortController();
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!active || !session) return;
        tokenStorage.assertSession(session.id);
        clear = () => {
          controller.abort();
          if (active) setState({
            loading: false,
            financeiro: null,
            historico: null,
            automatico: null
          });
        };
        session.signal.addEventListener('abort', clear, {
          once: true
        });
        const options = {
          signal: controller.signal,
          usageMonitoringSessionId: session.id,
          timeout: 15000
        };
        const results = await Promise.allSettled([apiClient.get(`/v2/compras/${compraId}/referencias`, options).then(r => apresentarReferenciaComplementar(r.data, compraId)), apiClient.get(`/v2/compras/${compraId}/indicadores-historicos`, options).then(r => validarHistoricoCompra(r.data, compraId)), apiClient.get(`/analises/compras/${compraId}/automatica`, options).then(r => validarAnaliseAutomatica(r.data, compraId))]);
        tokenStorage.assertSession(session.id);
        if (active && !controller.signal.aborted) setState({
          loading: false,
          ...Object.fromEntries(['financeiro', 'historico', 'automatico'].map((key, i) => [key, results[i].status === 'fulfilled' ? results[i].value : null]))
        });
      } catch {
        if (active) setState({
          loading: false,
          financeiro: null,
          historico: null,
          automatico: null
        });
      } finally {
        if (active && !session) setState({
          loading: false,
          financeiro: null,
          historico: null,
          automatico: null
        });
      }
    })();
    return () => {
      active = false;
      controller.abort();
      session?.signal.removeEventListener('abort', clear);
    };
  }, [compraId]);
  return state;
}
