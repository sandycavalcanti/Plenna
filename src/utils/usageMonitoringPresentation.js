const count = n => Number.isSafeInteger(n) && n >= 0;
const amount = n => n === null || count(n);
export function rankingTempoV2(value) {
  const total = value?.summary?.sourceTotals?.v2RegisteredMs ?? value?.summary?.sourceTotals?.v2RegisteredSeconds * 1000;
  if (!Number.isSafeInteger(total) || total <= 0) return [];
  const apps = new Map();
  for (const observation of value.observations || []) {
    const available = observation.sourceStatus === 'AVAILABLE' ? observation : observation.lastAvailable;
    for (const app of available?.applications || []) {
      const ms = app.durationMs ?? app.durationSeconds * 1000;
      if (!app.suppression && Number.isSafeInteger(ms) && ms > 0) apps.set(app.packageId, (apps.get(app.packageId) || 0) + ms);
    }
  }
  const items = [...apps].map(([label, ms]) => ({
    label,
    value: ms / 60000
  })).sort((a, b) => b.value - a.value);
  // Não publicar percentuais de um conjunto que não reconcilia com a fonte.
  return Math.abs(items.reduce((sum, item) => sum + item.value * 60000, 0) - total) < 0.01 ? items : [];
}
const application = a => a && typeof a.packageId === 'string' && amount(a.durationSeconds) && (a.durationMs === undefined || amount(a.durationMs) && a.durationMs === null === (a.durationSeconds === null)) && (a.durationSeconds === null ? a.suppression?.reason === 'DELETED_INTERVAL' && Array.isArray(a.suppression.tombstoneIds) : a.suppression === null);
export function validateUsagePeriod(value) {
  const s = value?.summary;
  if (value?.schemaVersion !== 2 || !s || s.schemaVersion !== 2 || !/^\d{4}-(0[1-9]|1[0-2])$/.test(s.localMonth) || !amount(s.totalRegisteredSeconds) || !count(s.installationCount) || !amount(s.sourceTotals?.v2RegisteredSeconds) || !amount(s.sourceTotals?.legacyRegisteredSeconds) || !['NO_DATA', 'PARTIAL', 'AMBIGUOUS'].includes(s.availability) || !['UNKNOWN', 'PARTIAL'].includes(s.coverage) || s.semantics !== 'SUM_OF_REGISTERED_APP_TIME_NOT_EXCLUSIVE_PERSON_TIME' || s.availability !== 'PARTIAL' && s.totalRegisteredSeconds !== null || !Array.isArray(value.observations) || !Array.isArray(value.legacy) || !Array.isArray(value.installations)) throw new Error('RF017_INVALID_SUMMARY');
  if (s.totalRegisteredMs !== undefined && !amount(s.totalRegisteredMs) || ['v2RegisteredMs', 'legacyRegisteredMs'].some(key => s.sourceTotals[key] !== undefined && !amount(s.sourceTotals[key]))) throw new Error('RF017_INVALID_SUMMARY');
  if (s.availability !== 'PARTIAL' && s.totalRegisteredMs != null) throw new Error('RF017_INVALID_SUMMARY');
  if (s.totalRegisteredMs !== undefined && s.totalRegisteredMs === null !== (s.totalRegisteredSeconds === null)) throw new Error('RF017_INVALID_SUMMARY');
  if (value.accessStats != null && ['identifiedOpenings', 'identifiedResumptions', 'unknownEntries', 'observedIntervals', 'openSegments', 'knownDurationMs'].some(key => !count(value.accessStats[key]))) throw new Error('RF017_INVALID_ACCESS_STATS');
  for (const o of value.observations) {
    if (!o || typeof o.associationId !== 'string' || typeof o.localDate !== 'string' || typeof o.timezone !== 'string' || !Number.isFinite(Date.parse(o.observedAt)) || !['AVAILABLE', 'UNAVAILABLE'].includes(o.sourceStatus)) throw new Error('RF017_INVALID_OBSERVATION');
    try {
      new Intl.DateTimeFormat('pt-BR', {
        timeZone: o.timezone
      }).format(0);
    } catch {
      throw new Error('RF017_INVALID_TIMEZONE');
    }
    const valid = o.sourceStatus === 'AVAILABLE' ? o : o.lastAvailable;
    if (o.sourceStatus === 'UNAVAILABLE' && o.applications !== null) throw new Error('RF017_INVALID_OBSERVATION');
    if (valid && (!Array.isArray(valid.applications) || !valid.applications.every(application))) throw new Error('RF017_INVALID_APPLICATION');
  }
  if (value.installations.some(i => typeof i.installationId !== 'string' || !amount(i.registeredSeconds) || typeof i.suppressed !== 'boolean')) throw new Error('RF017_INVALID_INSTALLATION_SUMMARY');
  return value;
}
export function usageObservationLabel(observation) {
  if (observation.sourceStatus !== 'UNAVAILABLE') return 'Tempo registrado; cobertura da fonte não garantida';
  return observation.lastAvailable ? 'Fonte indisponível; último valor preservado' : 'Fonte indisponível; sem registro anterior';
}
export function usageMonitoringLabel(status) {
  return {
    DISABLED: 'Monitoramento desativado nesta versão.',
    PENDING: 'Sincronização pendente.',
    CONSENT_REQUIRED: 'Monitoramento desativado. Consentimento não concedido.',
    PERMISSION_REQUIRED: 'Permita o acesso aos dados de uso no Android pelo Perfil.',
    ACTIVATION_REQUIRED: 'Ative o monitoramento nesta instalação pelo Perfil.',
    SERVICE_DISABLED: 'O serviço de monitoramento está indisponível.',
    SERVICE_UNAVAILABLE: 'O serviço de monitoramento está indisponível.',
    SOURCE_UNAVAILABLE: 'Não foi possível consultar os dados de uso neste aparelho.',
    SYNCING: 'Atualizando o tempo em aplicativos…',
    READY: 'Monitoramento pronto para atualizar com o PLENNA aberto.',
    ERROR: 'Não foi possível sincronizar. Tente novamente ao recuperar a conexão.'
  }[status] ?? '';
}
