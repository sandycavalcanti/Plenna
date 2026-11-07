import { apiClient } from './client';
import { tokenStorage } from './tokenStorage';
const alteracoesMonitoramento = new Map();
const observadores = new Set();
const ativacoesConfirmadas = new Set();
function diagnosticarErroConsentimento(error, metodo, caminho, operacao) {
  if (!__DEV__) return;
  const statusOriginal = error?.response?.status;
  const codigoOriginal = error?.code;
  const status = Number.isInteger(statusOriginal) && statusOriginal >= 100 && statusOriginal <= 599 ? statusOriginal : null;
  const codigo = ['ERR_BAD_REQUEST', 'ERR_BAD_RESPONSE', 'ERR_NETWORK', 'ECONNABORTED'].includes(codigoOriginal) ? codigoOriginal : null;
  const categoria = status === 401 ? 'AUTENTICACAO' : status === 403 ? 'AUTORIZACAO' : status !== null && status >= 500 ? 'SERVIDOR' : codigo === 'ERR_NETWORK' ? 'REDE' : status === 400 ? 'CONTRATO' : 'DESCONHECIDA';
  console.log('PLENNA_API_DIAGNOSTIC', {
    operacao,
    metodo,
    caminho,
    status,
    ambiente: 'desenvolvimento',
    categoria,
    codigo
  });
}
export function observarMonitoramentoAtivado(listener) {
  ativacoesConfirmadas.add(listener);
  return () => ativacoesConfirmadas.delete(listener);
}

// Estado transitório de requisições, nunca uma autorização local de coleta.
export function monitoramentoEmAlteracao(sessaoId) {
  return (alteracoesMonitoramento.get(sessaoId) ?? 0) > 0;
}
export function observarAlteracaoMonitoramento(observador) {
  observadores.add(observador);
  return () => observadores.delete(observador);
}
export async function registrarConsentimento(consentimentoTipoCodigo, status, config) {
  if (!['MONITORAMENTO_TEMPO_USO', 'MONITORAMENTO_ACESSOS'].includes(consentimentoTipoCodigo)) {
    try {
      const sessao = await tokenStorage.captureSession();
      if (!sessao) throw new Error('Usuário não autenticado');
      const sessaoEsperada = config?.usageMonitoringSessionId ?? sessao.id;
      tokenStorage.assertSession(sessaoEsperada);
      if (sessaoEsperada !== sessao.id) throw new Error('Sessão alterada');
      const response = await apiClient.post('/consentimento', {
        consentimentoTipoCodigo,
        status
      }, {
        ...config,
        usageMonitoringSessionId: sessao.id,
        signal: sessao.signal
      });
      tokenStorage.assertSession(sessao.id);
      return response.data;
    } catch (error) {
      diagnosticarErroConsentimento(error, 'POST', '/consentimento', 'registrar');
      throw error;
    }
  }
  const sessao = await tokenStorage.captureSession();
  if (!sessao) throw new Error('Usuário não autenticado');
  const sessaoEsperada = config?.usageMonitoringSessionId ?? sessao.id;
  tokenStorage.assertSession(sessaoEsperada);
  if (sessaoEsperada !== sessao.id) throw new Error('Sessão alterada');
  let confirmado = false;
  alteracoesMonitoramento.set(sessao.id, (alteracoesMonitoramento.get(sessao.id) ?? 0) + 1);
  try {
    for (const observador of observadores) {
      try {
        observador(sessao.id);
      } catch {}
    }
    const response = await apiClient.post('/consentimento', {
      consentimentoTipoCodigo,
      status
    }, {
      ...config,
      usageMonitoringSessionId: sessao.id,
      signal: sessao.signal
    });
    tokenStorage.assertSession(sessao.id);
    confirmado = true;
    return response.data;
  } catch (error) {
    diagnosticarErroConsentimento(error, 'POST', '/consentimento', 'registrar');
    throw error;
  } finally {
    const restantes = alteracoesMonitoramento.get(sessao.id) - 1;
    if (restantes) alteracoesMonitoramento.set(sessao.id, restantes);else alteracoesMonitoramento.delete(sessao.id);
    if (confirmado && !restantes && !sessao.signal.aborted) {
      for (const observador of observadores) {
        try {
          observador(sessao.id, {
            confirmed: true,
            code: consentimentoTipoCodigo,
            status
          });
        } catch {}
      }
    }
    if (confirmado && status === true && !restantes && !sessao.signal.aborted) {
      for (const listener of ativacoesConfirmadas) {
        try {
          listener(sessao);
        } catch {}
      }
    }
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
