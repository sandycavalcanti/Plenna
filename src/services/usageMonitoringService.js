import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { AppState } from 'react-native';
import { apiClient } from '../api/client';
import { tokenStorage } from '../api/tokenStorage';
import { getInstallationAnchor, getUsageObservations, cancelUsageCollection, hasUsageAccess, getModuleStatus } from '../../modules/plenna-usage-stats';
import { emitirAtualizacaoTempoUso } from '../utils/tempoUsoAtualizacao';
import { listarConsentimentos, monitoramentoEmAlteracao, observarAlteracaoMonitoramento } from '../api/consentimento';
import { createMonitoringEngine } from './monitoramentoEngine';
import { usageMonitoringHomologationEnabled, usageMonitoringReadsEnabled, usageMonitoringEnabled } from '../api/usageMonitoringPolicy';
import { validateUsagePeriod } from '../utils/usageMonitoringPresentation';
import { installationCredential } from '../utils/usageInstallation';
import { usageSyncState, publishUsageSyncState, classifyUsageFailure } from '../utils/usageMonitoringStatus';
export { usageMonitoringHomologationEnabled, usageMonitoringReadsEnabled };
const key = 'plenna.rf017.installation.v2';
let identityPending = null;
let storageWrite = Promise.resolve();
function saveIdentity(value) {
  const next = storageWrite.then(() => SecureStore.setItemAsync(key, JSON.stringify(value)));
  storageWrite = next.catch(() => {});
  return next;
}
async function identity() {
  if (!identityPending) identityPending = (async () => {
    await storageWrite;
    const anchor = await getInstallationAnchor();
    const raw = await SecureStore.getItemAsync(key);
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }
    const selected = await installationCredential(data, anchor, async () => {
      const bytes = await Crypto.getRandomBytesAsync(32);
      return {
        id: Crypto.randomUUID(),
        secret: [...bytes].map(n => n.toString(16).padStart(2, '0')).join('')
      };
    });
    data = selected.value;
    if (selected.created) await saveIdentity(data);
    const currentBoundary = tokenStorage.getUsageBoundary();
    if (!data.clientSession || data.clientSessionBoundary !== currentBoundary) {
      data = {
        ...data,
        clientSession: Crypto.randomUUID(),
        clientSessionBoundary: currentBoundary,
        contextId: null
      };
      await saveIdentity(data);
    }
    return {
      ...data,
      currentBoundary,
      needsNewEpisode: data.needsNewEpisode || !currentBoundary || data.sessionBoundary !== currentBoundary
    };
  })().finally(() => {
    identityPending = null;
  });
  return identityPending;
}
function config(value, session, signal) {
  return {
    usageMonitoringSessionId: session.id,
    signal,
    timeout: 15000,
    headers: {
      'x-rf017-installation-key': value.secret
    }
  };
}
async function post(path, payload, value, session, signal) {
  const response = await apiClient.post('/v2/tempo-uso' + path, payload, config(value, session, signal));
  return response.data;
}
async function activationHistoryKey(value, session) {
  const { data } = await apiClient.get('/users/user', {
    usageMonitoringSessionId: session.id,
    signal: session.signal,
    timeout: 5000,
  });
  tokenStorage.assertSession(session.id);
  if (!Number.isSafeInteger(data?.usuario_id) || data.usuario_id <= 0) return null;
  return `plenna.rf017.activated.${value.id}.${data.usuario_id}`;
}

export async function hasPreviouslyActivatedUsageMonitoring(session) {
  const value = await identity();
  const historyKey = await activationHistoryKey(value, session);
  const activated = historyKey ? await SecureStore.getItemAsync(historyKey) : null;
  tokenStorage.assertSession(session.id);
  return activated === 'true';
}

const engine = createMonitoringEngine({
  session: () => tokenStorage.captureSession(),
  assertSession: id => tokenStorage.assertSession(id),
  active: () => AppState.currentState === 'active',
  timezone: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  identity,
  permission: hasUsageAccess,
  consentChanging: monitoramentoEmAlteracao,
  prepare: (body, value, session, signal) => post('/prepare', body, value, session, signal),
  remember: async (value, reply, session) => {
    await saveIdentity({
      ...value,
      currentBoundary: undefined,
      sessionBoundary: value.currentBoundary,
      contextId: reply.contextId,
      needsNewEpisode: false,
      pendingActivation: null
    });
    if (value.pendingActivation === value.currentBoundary && value.currentBoundary) {
      try {
        const historyKey = await activationHistoryKey(value, session);
        if (historyKey) await SecureStore.setItemAsync(historyKey, 'true');
      } catch {
        // O registro local serve apenas para a apresentação da próxima ativação.
      }
    }
  },
  collect: getUsageObservations,
  cancelNative: cancelUsageCollection,
  submit: async (body, value, session, signal) => (await apiClient.put('/v2/tempo-uso/observations', body, config(value, session, signal))).data,
  updated: emitirAtualizacaoTempoUso
});
export async function prepareUsageMonitoringActivation(session) {
  const value = await identity();
  tokenStorage.assertSession(session.id);
  await saveIdentity({
    ...value,
    pendingActivation: value.currentBoundary
  });
  setSyncStatus(session.id, 'PENDING');
  tokenStorage.assertSession(session.id);
}
export function getUsageMonitoringSyncStatus(sessionId) {
  return usageSyncState(sessionId).status;
}
export async function readUsageMonitoringStatus(session) {
  if (!usageMonitoringEnabled) return 'DISABLED';
  if (monitoramentoEmAlteracao(session.id)) return 'PENDING';
  // As verificações são independentes: uma falha remota não conserva uma negação Android antiga.
  const [consent, module, permission] = await Promise.allSettled([listarConsentimentos({
    usageMonitoringSessionId: session.id,
    signal: session.signal
  }), getModuleStatus(), hasUsageAccess()]);
  tokenStorage.assertSession(session.id);
  if (consent.status === 'fulfilled' && Array.isArray(consent.value) && !consent.value.some(row => (row.tb_consentimento_tipo?.consentimento_tipo_codigo ?? row.consentimento_tipo_codigo) === 'MONITORAMENTO_TEMPO_USO' && row.consentimento_status === true)) return 'CONSENT_REQUIRED';
  if (module.status === 'rejected' || !module.value?.available) return 'SOURCE_UNAVAILABLE';
  if (permission.status === 'rejected') return 'SOURCE_UNAVAILABLE';
  if (permission.value !== true) return 'PERMISSION_REQUIRED';
  if (consent.status === 'rejected') {
    const status = classifyUsageFailure(consent.reason).status;
    return status === 'ERROR' ? 'STATUS_UNAVAILABLE' : status;
  }
  if (!Array.isArray(consent.value)) return 'STATUS_UNAVAILABLE';
  const status = getUsageMonitoringSyncStatus(session.id);
  return status === 'PERMISSION_REQUIRED' ? 'PENDING' : status;
}
function setSyncStatus(sessionId, status, details) {
  publishUsageSyncState(sessionId, status, details);
}
let syncGeneration = 0;
export async function synchronizeUsageMonitoring(expectedSessionId) {
  if (!usageMonitoringEnabled) throw new Error('RF017_DISABLED');
  const session = await tokenStorage.captureSession();
  if (!session) throw new Error('SESSION_REQUIRED');
  if (expectedSessionId !== undefined && session.id !== expectedSessionId) throw new Error('SESSION_INVALIDATED');
  // A parada controlada pertence à sessão de login. Retornar ao foreground
  // não autoriza outra coleta ou envio enquanto esse bloqueio estiver ativo.
  if (getUsageMonitoringSyncStatus(session.id) === 'CONTROLLED_PAUSE') throw new Error('CONTROLLED_SYNC_PAUSED');
  if (monitoramentoEmAlteracao(session.id)) throw new Error('CONSENT_CHANGE_IN_PROGRESS');
  const generation = ++syncGeneration;
  setSyncStatus(session.id, 'SYNCING');
  try {
    const value = await identity();
    tokenStorage.assertSession(session.id);
    const activate = !!value.pendingActivation && value.pendingActivation === tokenStorage.getUsageBoundary();
    let result = await engine.run({
      activate,
      expectedSessionId: session.id
    });
    if (activate && result?.reason === 'NO_ELIGIBLE_INTERVAL') {
      result = await engine.run({ expectedSessionId: session.id });
    }
    tokenStorage.assertSession(session.id);
    if (generation === syncGeneration) setSyncStatus(session.id, result?.reason === 'NO_ELIGIBLE_INTERVAL' ? 'PENDING' : 'READY');
    return result;
  } catch (error) {
    if (!session.signal.aborted && generation === syncGeneration) {
      const failure = classifyUsageFailure(error);
      setSyncStatus(session.id, failure.status, failure);
    }
    throw error;
  }
}
export async function activateUsageMonitoring(session) {
  const status = await readUsageMonitoringStatus(session);
  if (status === 'CONSENT_REQUIRED' || status === 'PERMISSION_REQUIRED') return status;
  if (!['ACTIVATION_REQUIRED', 'PENDING', 'READY', 'SYNCING'].includes(status)) throw new Error(status);
  await prepareUsageMonitoringActivation(session);
  await synchronizeUsageMonitoring(session.id);
  tokenStorage.assertSession(session.id);
  return getUsageMonitoringSyncStatus(session.id);
}
export function cancelUsageMonitoring() {
  engine.stop();
}
export async function stopUsageMonitoringForLogout(previousToken) {
  engine.stop();
  if (!usageMonitoringEnabled) return;
  await storageWrite;
  const raw = await SecureStore.getItemAsync(key);
  let value;
  try {
    value = raw ? JSON.parse(raw) : null;
  } catch {
    return;
  }
  if (!value) return;
  await saveIdentity({
    ...value,
    needsNewEpisode: true,
    pendingActivation: null
  });
  // Usa a sessão anterior para encerrar o contexto remoto, sem atrasar o logout
  // nem enviar uma credencial antiga pelo interceptor da conta atual.
  if (previousToken && value.contextId && value.clientSession && typeof fetch === 'function') {
    const cancel = new AbortController(),
      timeout = setTimeout(() => cancel.abort(), 2000);
    fetch(apiClient.getUri({
      url: '/v2/tempo-uso/close'
    }), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${previousToken}`,
        'x-rf017-installation-key': value.secret
      },
      body: JSON.stringify({
        schemaVersion: 3,
        installationId: value.id,
        sessionId: value.clientSession,
        contextId: value.contextId
      }),
      signal: cancel.signal
    }).catch(() => {}).finally(() => clearTimeout(timeout));
  }
}
observarAlteracaoMonitoramento((sessionId, change) => {
  syncGeneration++;
  engine.stop();
  setSyncStatus(sessionId, change?.confirmed && change.code === 'MONITORAMENTO_TEMPO_USO' && change.status === false ? 'CONSENT_REQUIRED' : 'PENDING');
});
// Sair do primeiro plano apenas cancela: não agenda coleta em segundo plano.
if (usageMonitoringEnabled) AppState.addEventListener('change', state => {
  if (state !== 'active') engine.stop();
});
export async function readUsageMonitoringPeriod(month, session, signal) {
  try {
    const response = await apiClient.get('/v2/tempo-uso/summary', {
      params: {
        month
      },
      usageMonitoringSessionId: session.id,
      signal,
      timeout: 15000
    });
    if (response.data?.summary?.localMonth !== month) throw new Error('RF017_MONTH_MISMATCH');
    const data = validateUsagePeriod(response.data);
    return data;
  } catch (error) {
    throw error;
  }
}
