import { rankingTempoV2 } from './usageMonitoringPresentation.js';
import { dataLocalRegistroUso } from './historicoTempoUso.js';
const names = {
  'com.zzkko': 'SHEIN',
  'com.shopee.br': 'Shopee',
  'com.mercadolibre': 'Mercado Livre'
};
export const usageAppName = packageId => names[packageId] ?? 'Aplicativo de compra';
export function usageDuration(seconds) {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return 'Indisponível';
  if (seconds > 0 && seconds < 1) return '< 1 s';
  seconds = Math.floor(seconds);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60),
    hours = Math.floor(minutes / 60);
  return hours ? `${hours}h${minutes % 60 ? ` ${minutes % 60}min` : ''}` : `${minutes}min`;
}
export function usagePeriodMetrics(data) {
  const ranking = rankingTempoV2(data).map(item => ({
    ...item,
    label: usageAppName(item.label)
  }));
  const days = new Map(),
    packages = new Set();
  for (const observation of data?.observations ?? []) {
    const valid = observation.sourceStatus === 'AVAILABLE' ? observation : observation.lastAvailable;
    if (!valid) continue;
    let seconds = 0,
      known = false;
    for (const app of valid.applications ?? []) {
      const milliseconds = app.durationMs ?? (app.durationSeconds === null ? null : app.durationSeconds * 1000);
      if (app.suppression || !Number.isSafeInteger(milliseconds)) continue;
      packages.add(app.packageId);
      seconds += milliseconds / 1000;
      known = true;
    }
    if (known) days.set(observation.localDate, (days.get(observation.localDate) ?? 0) + seconds);
  }
  // Uma contribuição ambígua não deve gerar evolução ou percentuais confirmados.
  const totals = data?.summary?.sourceTotals;
  const sourceTotal = totals?.v2RegisteredMs !== undefined ? totals.v2RegisteredMs === null ? null : totals.v2RegisteredMs / 1000 : totals?.v2RegisteredSeconds;
  const daily = sourceTotal == null || Math.abs([...days.values()].reduce((sum, n) => sum + n, 0) - sourceTotal) > 0.000001 ? [] : [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, seconds]) => ({
    date,
    seconds
  }));
  const summary = data?.summary;
  return {
    ranking,
    daily,
    appCount: packages.size,
    total: summary?.totalRegisteredMs !== undefined ? summary.totalRegisteredMs === null ? null : summary.totalRegisteredMs / 1000 : summary?.totalRegisteredSeconds ?? null
  };
}
const view = (kind, message, action = null) => ({
  kind,
  message,
  action
});
export function resolveUsageView({
  data,
  loading,
  readError,
  monitoring = 'PENDING'
}) {
  const hasData = data?.summary?.availability !== 'NO_DATA' && data?.summary?.availability != null;
  if (monitoring === 'CONSENT_REQUIRED' || monitoring === 'DISABLED') return view('DISABLED', hasData ? 'Monitoramento pausado. Histórico disponível.' : 'O monitoramento está desativado.', 'PROFILE');
  if (monitoring === 'PERMISSION_REQUIRED') return view('PERMISSION', hasData ? 'Permissão Android pendente para atualizar o histórico.' : 'Permita o acesso aos dados de uso no Android.', 'PROFILE');
  if (monitoring === 'ACTIVATION_REQUIRED') return view('ACTIVATION', 'Ative o monitoramento neste aparelho pelo Perfil.', 'PROFILE');
  if (monitoring === 'SERVICE_DISABLED' || monitoring === 'SERVICE_UNAVAILABLE') return view('SERVICE_UNAVAILABLE', 'O serviço de monitoramento está indisponível.', 'READ');
  if (monitoring === 'STATUS_UNAVAILABLE') return view('STATUS_UNAVAILABLE', 'Não foi possível verificar o monitoramento.', 'READ');
  if (monitoring === 'SYNCING') return view('SYNCING', 'Atualizando o tempo em aplicativos…');
  if (readError) return view('READ_ERROR', hasData ? 'Não foi possível atualizar este período.' : 'Não foi possível consultar o tempo em aplicativos.', 'READ');
  if (monitoring === 'CONTROLLED_PAUSE') return view('PAUSED', hasData ? 'Atualizações pausadas.' : 'Aguardando liberação para atualizar.', 'READ');
  if (monitoring === 'ERROR') return view('SYNC_ERROR', 'Não foi possível sincronizar o tempo em aplicativos.', 'SYNC');
  if (loading && !data) return view('LOADING', 'Carregando tempo em aplicativos…');
  const unavailable = data?.observations?.some(o => o.sourceStatus === 'UNAVAILABLE');
  if (monitoring === 'SOURCE_UNAVAILABLE' || unavailable && !hasData) return view('SOURCE_UNAVAILABLE', 'A fonte de uso está temporariamente indisponível.', 'READ');
  if (hasData) {
    if (data.summary.availability === 'AMBIGUOUS') return view('PARTIAL', 'Fontes sobrepostas. Consulte os valores separados.');
    return view(unavailable ? 'PARTIAL' : 'DATA', unavailable ? 'Cobertura parcial. Última leitura disponível preservada.' : 'Cobertura parcial do período.');
  }
  if (monitoring === 'PENDING') return view('PENDING', 'O tempo aparecerá após a próxima sincronização.');
  return view('EMPTY', 'Ainda não há registros neste período.');
}

// Recorta observações locais antes de calcular o resumo da Home.
// Contagens mensais de acessos não representam contagens diárias.
export function usageTodayData(data, today) {
  if (!data) return null;
  const observations = (data.observations ?? []).filter(o => o.localDate === today);
  const legacy = (data.legacy ?? []).filter(row => dataLocalRegistroUso(row) === today);
  let total = 0,
    known = false,
    suppressed = false;
  for (const o of observations) {
    const valid = o.sourceStatus === 'AVAILABLE' ? o : o.lastAvailable;
    for (const app of valid?.applications ?? []) {
      const ms = app.durationMs !== undefined ? app.durationMs : app.durationSeconds == null ? null : app.durationSeconds * 1000;
      if (app.suppression || ms == null) {
        suppressed = true;
        continue;
      }
      if (Number.isSafeInteger(ms) && ms >= 0) {
        total += ms;
        known = true;
      }
    }
  }
  // Não resolver na UI a ambiguidade entre fontes/instalações sinalizada pela API.
  const ambiguous = data.summary?.availability === 'AMBIGUOUS';
  const value = known && !suppressed && !ambiguous ? total : null;
  const legacyValues = legacy.map(row => row.rf017_suppression ? null : row.tempo_uso_duracao_segundos ?? (row.tempo_uso_minutos == null ? null : Number(row.tempo_uso_minutos) * 60));
  const legacyTotal = legacyValues.length && legacyValues.every(n => Number.isFinite(Number(n)) && n != null && Number(n) >= 0) ? legacyValues.reduce((sum, n) => sum + Number(n), 0) : null;
  return {
    ...data,
    observations,
    legacy,
    accessStats: data.dailyAccessDate === today ? data.dailyAccessStats ?? null : null,
    summary: {
      ...data.summary,
      availability: !known && !legacy.length && !suppressed ? 'NO_DATA' : legacy.length || suppressed || ambiguous ? 'AMBIGUOUS' : 'PARTIAL',
      totalRegisteredMs: legacy.length ? null : value,
      totalRegisteredSeconds: legacy.length || value == null ? null : value / 1000,
      sourceTotals: {
        v2RegisteredMs: value,
        v2RegisteredSeconds: value == null ? null : value / 1000,
        legacyRegisteredSeconds: legacyTotal
      }
    }
  };
}
export function usageLastUpdate(data) {
  const dates = (data?.observations ?? []).map(o => o.sourceStatus === 'AVAILABLE' ? o.observedAt : o.lastAvailable?.observedAt).filter(value => Number.isFinite(Date.parse(value)));
  return dates.length ? new Date(Math.max(...dates.map(value => Date.parse(value)))).toLocaleString('pt-BR') : null;
}

// Apenas apresentação: mantém os acumulados e a ambiguidade fornecidos pela API.
export const usageTimeLabel = seconds => usageDuration(seconds).replace(/(\d)(h|min|s)/g, '$1 $2');
export function usageMonthLabel(month) {
  const [year, number] = month.split('-').map(Number);
  return new Date(year, number - 1, 15).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
}
export function usageUpdateLabel(data, compact = false) {
  const dates = (data?.observations ?? []).map(o => o.sourceStatus === 'AVAILABLE' ? o.observedAt : o.lastAvailable?.observedAt).filter(value => Number.isFinite(Date.parse(value)));
  if (!dates.length) return null;
  const date = new Date(Math.max(...dates.map(value => Date.parse(value))));
  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return compact && date.toLocaleDateString() === new Date().toLocaleDateString() ? `Atualizado às ${time}` : `Atualizado em ${date.toLocaleDateString('pt-BR')}, ${time}`;
}
export function usageLegacyMetrics(rows = []) {
  if (!rows.length) return {
    total: null,
    apps: []
  };
  const apps = new Map();
  let total = 0;
  for (const row of rows) {
    const value = row.tempo_uso_duracao_segundos ?? (row.tempo_uso_minutos == null ? null : Number(row.tempo_uso_minutos) * 60);
    if (row.rf017_suppression || value == null || !Number.isFinite(Number(value)) || Number(value) < 0) return {
      total: null,
      apps: []
    };
    const seconds = Number(value);
    total += seconds;
    if (row.tempo_uso_nome && seconds > 0) apps.set(row.tempo_uso_nome, (apps.get(row.tempo_uso_nome) ?? 0) + seconds);
  }
  const items = [...apps].map(([label, seconds]) => ({
    label,
    seconds
  })).sort((a, b) => b.seconds - a.seconds);
  return {
    total,
    apps: Math.abs(items.reduce((sum, item) => sum + item.seconds, 0) - total) < 0.000001 ? items : []
  };
}
export function usageCardMetrics(data, today) {
  if (!data || data.summary?.availability === 'NO_DATA') return {
    total: null,
    apps: []
  };
  if (today && ((data.observations ?? []).some(o => o.localDate > today) || (data.legacy ?? []).some(row => dataLocalRegistroUso(row) > today))) return {
    total: null,
    apps: []
  };
  const metrics = usagePeriodMetrics(data);
  if (metrics.total == null || !Number.isFinite(metrics.total) || metrics.total < 0) return {
    total: null,
    apps: []
  };
  const apps = new Map();
  for (const item of metrics.ranking) apps.set(item.label, (apps.get(item.label) ?? 0) + item.value * 60);
  if (data.legacy?.length) {
    const legacy = usageLegacyMetrics(data.legacy);
    if (legacy.total == null) return {
      total: metrics.total,
      apps: []
    };
    for (const item of legacy.apps) apps.set(item.label, (apps.get(item.label) ?? 0) + item.seconds);
  }
  const items = [...apps].map(([label, seconds]) => ({
    label,
    seconds
  })).filter(item => item.seconds > 0).sort((a, b) => b.seconds - a.seconds);
  const reconciles = Math.abs(items.reduce((sum, item) => sum + item.seconds, 0) - metrics.total) < 0.000001;
  return {
    total: metrics.total,
    apps: reconciles ? items : []
  };
}
export function usageCardState(period, data, metrics, compact) {
  const state = resolveUsageView({
    ...period,
    data
  });
  const messages = {
    DISABLED: 'Monitoramento desativado.',
    PERMISSION: 'Permita o acesso no Android para atualizar os registros.',
    ACTIVATION: 'Conclua a ativação no Perfil.',
    SERVICE_UNAVAILABLE: 'Tempo em aplicativos indisponível no momento.',
    STATUS_UNAVAILABLE: 'Não foi possível verificar o monitoramento.',
    SOURCE_UNAVAILABLE: 'Os registros estão temporariamente indisponíveis.',
    SYNC_ERROR: 'Não foi possível atualizar os registros.',
    READ_ERROR: metrics.total != null ? 'Não foi possível atualizar este período.' : 'Não foi possível carregar os registros.',
    LOADING: 'Carregando tempo registrado…',
    SYNCING: 'Atualizando registros…',
    PENDING: 'Seus registros aparecerão após a próxima atualização.',
    PAUSED: metrics.total != null ? 'Atualizações pausadas.' : 'Aguardando liberação para atualizar.',
    EMPTY: compact ? 'Nenhum registro hoje.' : 'Nenhum registro neste mês.'
  };
  let message = messages[state.kind] ?? null;
  if (['DATA', 'PARTIAL'].includes(state.kind)) {
    if (metrics.total == null) message = 'Não foi possível calcular o tempo registrado neste período.';else if (data?.observations?.some(o => o.sourceStatus === 'UNAVAILABLE')) message = 'Alguns registros podem estar desatualizados.';else if (metrics.total > 0 && !metrics.apps.length) message = 'Detalhamento por aplicativo indisponível.';
  }
  return {
    ...state,
    message,
    action: period.monitoring === 'SERVICE_DISABLED' || state.kind === 'PAUSED' ? null : state.action
  };
}
