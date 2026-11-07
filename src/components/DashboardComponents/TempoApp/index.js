import React, { useMemo } from 'react';
import UsageTimeCard from '../../UsageTimePanel/UsageTimeCard';
import { obterJanelaDiaLocal } from '../../../utils/tempoUsoSync';
import { filtrarHistoricoUso, dataLocalRegistroUso } from '../../../utils/historicoTempoUso';
import { usageLegacyMetrics } from '../../../utils/usageMonitoringView';
export default function TempoApp({
  tempoUso = [],
  mes = obterJanelaDiaLocal().dataLocal.slice(0, 7),
  loading = false,
  error = false,
  onRetry
}) {
  const today = obterJanelaDiaLocal().dataLocal;
  const rows = useMemo(() => filtrarHistoricoUso(tempoUso, mes).filter(row => dataLocalRegistroUso(row) <= today), [tempoUso, mes, today]);
  const metrics = useMemo(() => usageLegacyMetrics(rows), [rows]);
  const state = loading ? {
    kind: 'LOADING',
    message: 'Carregando tempo registrado…'
  } : error ? {
    kind: 'READ_ERROR',
    message: 'Não foi possível carregar os registros.',
    action: onRetry ? 'READ' : null
  } : !rows.length ? {
    kind: 'EMPTY',
    message: 'Nenhum registro neste mês.'
  } : metrics.total == null ? {
    kind: 'PARTIAL',
    message: 'Não foi possível calcular o tempo registrado neste período.'
  } : {
    kind: 'DATA',
    message: null
  };
  return <UsageTimeCard scope={mes} total={metrics.total} apps={metrics.apps} state={state} onRetry={onRetry} />;
}
