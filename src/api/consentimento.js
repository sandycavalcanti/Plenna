import { apiClient } from './client';
import { tokenStorage } from './tokenStorage';

const alteracoesMonitoramento = new Map();
const observadores = new Set();

// Estado transitório de requisições, nunca uma autorização local de coleta.
export function monitoramentoEmAlteracao(sessaoId) {
  return (alteracoesMonitoramento.get(sessaoId) ?? 0) > 0;
}

export function observarAlteracaoMonitoramento(observador) {
  observadores.add(observador);
  return () => observadores.delete(observador);
}

export async function registrarConsentimento(
  consentimentoTipoCodigo,
  status,
  config
) {
  if (consentimentoTipoCodigo !== 'MONITORAMENTO_TEMPO_USO') {
    const response = await apiClient.post('/consentimento', {
      consentimentoTipoCodigo, status,
    }, config);
    return response.data;
  }
  const sessao = await tokenStorage.captureSession();
  if (!sessao) throw new Error('Usuário não autenticado');
  tokenStorage.assertSession(config?.rf017SessionId ?? sessao.id);
  alteracoesMonitoramento.set(sessao.id, (alteracoesMonitoramento.get(sessao.id) ?? 0) + 1);
  try {
    observadores.forEach(observador => observador(sessao.id));
    const response = await apiClient.post('/consentimento', {
      consentimentoTipoCodigo,
      status,
    }, { ...config, rf017SessionId: sessao.id, signal: sessao.signal });
    tokenStorage.assertSession(sessao.id);
    return response.data;
  } finally {
    const restantes = alteracoesMonitoramento.get(sessao.id) - 1;
    if (restantes) alteracoesMonitoramento.set(sessao.id, restantes);
    else alteracoesMonitoramento.delete(sessao.id);
  }
}

export async function listarConsentimentos(config) {
  try {
    const response = await apiClient.get('/consentimento', config);
    return response.data;
  } catch (error) {
    // Diagnóstico temporário RF017: somente metadados permitidos em desenvolvimento.
    if (__DEV__) {
      const status = error?.response?.status;
      console.log('RF017 HTTP ERROR', {
        operacao: 'listarConsentimentos',
        metodo: 'GET',
        path: '/consentimento',
        status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
      });
    }
    throw error;
  }
}
