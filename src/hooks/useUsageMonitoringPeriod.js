import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { tokenStorage } from '../api/tokenStorage';
import { readUsageMonitoringPeriod, readUsageMonitoringStatus } from '../services/usageMonitoringService';
import { observarAtualizacaoTempoUso } from '../utils/tempoUsoAtualizacao';
import { observeUsageSyncState, usageSyncState } from '../utils/usageMonitoringStatus';
import { observarAlteracaoMonitoramento } from '../api/consentimento';
export function useUsageMonitoringPeriod(month) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    readError: false
  });
  const [monitoring, setMonitoring] = useState('PENDING');
  const generation = useRef(0),
    monitorGeneration = useRef(0),
    requestController = useRef(null);
  const scope = useRef({
    month: null,
    sessionId: null
  });
  const refreshMonitoring = useCallback(async () => {
    const request = ++monitorGeneration.current;
    const session = await tokenStorage.captureSession();
    if (!session) return;
    let status;
    try {
      status = await readUsageMonitoringStatus(session);
    } catch {
      status = usageSyncState(session.id).status;
    }
    tokenStorage.assertSession(session.id);
    if (request === monitorGeneration.current) setMonitoring(status);
  }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const session = await tokenStorage.captureSession();
      if (!session || request !== generation.current) return;
      tokenStorage.assertSession(session.id);
      const sameScope = scope.current.month === month && scope.current.sessionId === session.id;
      scope.current = {
        month,
        sessionId: session.id
      };
      setState(previous => ({
        data: sameScope ? previous.data : null,
        loading: true,
        readError: false
      }));
      // A falha de consulta não apaga a verificação independente da permissão.
      refreshMonitoring().catch(() => {});
      const data = await readUsageMonitoringPeriod(month, session, controller.signal);
      tokenStorage.assertSession(session.id);
      if (request === generation.current) setState({
        data,
        loading: false,
        readError: false
      });
    } catch {
      if (request === generation.current && !controller.signal.aborted) setState(previous => ({
        ...previous,
        loading: false,
        readError: true
      }));
    }
  }, [month, refreshMonitoring]);
  useFocusEffect(useCallback(() => {
    let disposed = false,
      captured;
    const clear = () => {
      generation.current++;
      monitorGeneration.current++;
      requestController.current?.abort();
      scope.current = {
        month: null,
        sessionId: null
      };
      setState({
        data: null,
        loading: false,
        readError: false
      });
      setMonitoring('PENDING');
    };
    tokenStorage.captureSession().then(session => {
      if (disposed) return;
      captured = session;
      if (!session || session.signal.aborted) clear();else session.signal.addEventListener('abort', clear);
    }).catch(() => {
      if (!disposed) clear();
    });
    refresh();
    const unsubscribeData = observarAtualizacaoTempoUso(refresh);
    // O resultado da própria sincronização já pertence à sessão: não repetir
    // consultas de consentimento e permissão a cada transição de progresso.
    const unsubscribeStatus = observeUsageSyncState(event => {
      if (event?.sessionId === scope.current.sessionId) {
        monitorGeneration.current++;
        setMonitoring(event.status);
      }
    });
    const unsubscribeConsent = observarAlteracaoMonitoramento((sessionId, change) => {
      if (sessionId !== scope.current.sessionId || !change?.confirmed || change.status !== false) return;
      // Revogar a coleta não apaga os acumulados, mas retira os detalhes em
      // memória que deixaram de estar autorizados, mesmo se a API ficar offline.
      monitorGeneration.current++;
      generation.current++;
      requestController.current?.abort();
      setState(previous => ({
        ...previous,
        loading: false,
        data: previous.data ? {
          ...previous.data,
          accessStats: null,
          dailyAccessStats: null
        } : null
      }));
      if (change.code === 'MONITORAMENTO_TEMPO_USO') setMonitoring('CONSENT_REQUIRED');
    });
    const appState = AppState.addEventListener('change', value => {
      if (value === 'active') refresh();
    });
    return () => {
      disposed = true;
      generation.current++;
      monitorGeneration.current++;
      requestController.current?.abort();
      captured?.signal.removeEventListener('abort', clear);
      unsubscribeData();
      unsubscribeStatus();
      unsubscribeConsent();
      appState.remove();
    };
  }, [refresh, refreshMonitoring]));
  return {
    ...state,
    loading: scope.current.month !== month || state.loading,
    data: scope.current.month === month ? state.data : null,
    monitoring,
    refresh
  };
}
