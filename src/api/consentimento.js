import { apiClient } from './client';
import { tokenStorage } from './tokenStorage';

const alteracoesMonitoramento = new Map();
const observadores = new Set();

function diagnosticarErroConsentimento(error, metodo, caminho, operacao) {
  if (!__DEV__) return;
  const statusOriginal = error?.response?.status;
  const codigoOriginal = error?.code;
  const status = Number.isInteger(statusOriginal) && statusOriginal >= 100 && statusOriginal <= 599
    ? statusOriginal
    : null;
  const codigo = ['ERR_BAD_REQUEST', 'ERR_BAD_RESPONSE', 'ERR_NETWORK', 'ECONNABORTED'].includes(codigoOriginal)
    ? codigoOriginal
    : null;
  const categoria = status === 401
    ? 'AUTENTICACAO'
    : status === 403
      ? 'AUTORIZACAO'
      : status !== null && status >= 500
        ? 'SERVIDOR'
        : codigo === 'ERR_NETWORK'
          ? 'REDE'
          : status === 400
            ? 'CONTRATO'
            : 'DESCONHECIDA';
  console.log('PLENNA_API_DIAGNOSTIC', {
    operacao,
    metodo,
    caminho,
    status,
    ambiente: __DEV__ ? 'desenvolvimento' : 'producao',
    categoria,
    codigo,
  });
}

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
    try {
      const sessao = await tokenStorage.captureSession();
      if (!sessao) throw new Error('Usuário não autenticado');
      const sessaoEsperada = config?.rf017SessionId ?? sessao.id;
      tokenStorage.assertSession(sessaoEsperada);
      if (sessaoEsperada !== sessao.id) throw new Error('Sessão alterada');
      const response = await apiClient.post('/consentimento', {
        consentimentoTipoCodigo, status,
      }, { ...config, rf017SessionId: sessao.id, signal: sessao.signal });
      tokenStorage.assertSession(sessao.id);
      return response.data;
    } catch (error) {
      diagnosticarErroConsentimento(error, 'POST', '/consentimento', 'registrar');
      throw error;
    }
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
  } catch (error) {
    diagnosticarErroConsentimento(error, 'POST', '/consentimento', 'registrar');
    throw error;
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
    diagnosticarErroConsentimento(error, 'GET', '/consentimento', 'listar');
    throw error;
  }
}
