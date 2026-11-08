const listeners = new Set();
let current = {
  sessionId: null,
  status: 'PENDING',
  stage: null,
  code: null
};
export function usageSyncState(sessionId) {
  return current.sessionId === sessionId ? current : {
    sessionId,
    status: 'PENDING',
    stage: null,
    code: null
  };
}
export function publishUsageSyncState(sessionId, status, details = {}) {
  current = {
    sessionId,
    status,
    stage: details.stage ?? null,
    code: details.code ?? null
  };
  for (const listener of [...listeners]) {
    try {
      listener(current);
    } catch {}
  }
}
export function observeUsageSyncState(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function classifyUsageFailure(error) {
  const code = error?.response?.data?.error?.code ?? error?.code ?? error?.message;
  const stage = error?.usageMonitoringStage ?? 'PREPARATION';
  // Somente respostas explícitas de controle interrompem novas tentativas.
  // Uma pausa não é sucesso e não pode ocultar falhas reais da API.
  if (code === 'CONTROLLED_SYNC_PAUSED' || code === 'CONTROLLED_SYNC_FINISHED' && error?.response?.status === 409 || code === 'HOMOLOGATION_CAPTURE_NOT_ARMED' && error?.response?.status === 503) return {
    status: 'CONTROLLED_PAUSE',
    stage,
    code
  };
  if (code === 'CONSENT_REQUIRED') return {
    status: 'CONSENT_REQUIRED',
    stage,
    code
  };
  if (code === 'USAGE_ACCESS_REQUIRED') return {
    status: 'PERMISSION_REQUIRED',
    stage,
    code
  };
  if (['ACTIVATION_REQUIRED', 'FIRST_ACTIVATION_REQUIRED', 'EXPLICIT_REAUTHORIZATION_REQUIRED', 'INSTALLATION_NOT_FOUND'].includes(code)) return {
    status: 'ACTIVATION_REQUIRED',
    stage,
    code
  };
  if (code === 'RF017_V2_NOT_ENABLED') return {
    status: 'SERVICE_DISABLED',
    stage,
    code
  };
  if (['RF017_COLLECTOR_4_NATIVE_REQUIRED', 'RF017_V3_NATIVE_REQUIRED', 'RF017_V2_NATIVE_REQUIRED', 'RF017_NATIVE_ANCHOR_INVALID'].includes(code)) return {
    status: 'SOURCE_UNAVAILABLE',
    stage,
    code
  };
  if (['CONSENT_CHANGE_IN_PROGRESS', 'OPERATION_CANCELLED', 'SESSION_INVALIDATED', 'RF017_SESSION_INVALIDATED', 'ERR_CANCELED'].includes(code)) return {
    status: 'PENDING',
    stage,
    code: 'OPERATION_CANCELLED'
  };
  const safeCode = ['RF017_UNAVAILABLE', 'ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT', 'INVALID_NATIVE_RESPONSE', 'INVALID_CATALOG', 'TIMEZONE_VALIDATION_REQUIRED', 'REVISION_CONFLICT', 'ASSOCIATION_CHANGED'].includes(code) ? code : 'REQUEST_FAILED';
  return {
    status: error?.response?.status === 503 ? 'SERVICE_UNAVAILABLE' : 'ERROR',
    stage,
    code: safeCode
  };
}
