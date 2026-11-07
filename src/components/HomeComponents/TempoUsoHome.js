import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import UsageTimeCard from '../UsageTimePanel/UsageTimeCard';
import { obterJanelaDiaLocal } from '../../utils/tempoUsoSync';
import { dataLocalRegistroUso } from '../../utils/historicoTempoUso';
import { usageLegacyMetrics } from '../../utils/usageMonitoringView';
export default function TempoUsoHome({
  estado,
  registros = [],
  onRetry,
  onDetails,
  onSettings
}) {
  const navigation = useNavigation();
  const today = obterJanelaDiaLocal().dataLocal;
  const rows = useMemo(() => registros.filter(row => dataLocalRegistroUso(row) === today), [registros, today]);
  const metrics = useMemo(() => usageLegacyMetrics(rows), [rows]);
  const state = ['CARREGANDO', 'NAO_SOLICITADO'].includes(estado) ? {
    kind: 'LOADING',
    message: 'Carregando tempo registrado…'
  } : estado === 'ERRO' ? {
    kind: 'READ_ERROR',
    message: 'Não foi possível carregar os registros.',
    action: onRetry ? 'READ' : null
  } : estado === 'SEM_CONSENTIMENTO' ? {
    kind: 'DISABLED',
    message: 'Monitoramento desativado.',
    action: 'PROFILE'
  } : !rows.length ? {
    kind: 'EMPTY',
    message: 'Nenhum registro hoje.'
  } : metrics.total == null ? {
    kind: 'PARTIAL',
    message: 'Não foi possível calcular o tempo registrado neste período.'
  } : {
    kind: 'DATA',
    message: null
  };
  return <UsageTimeCard compact scope={today} total={metrics.total} apps={metrics.apps} state={state} onRetry={onRetry} onSettings={onSettings ?? (() => navigation.navigate('Profile'))} onDetails={onDetails} />;
}
