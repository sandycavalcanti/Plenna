import { apiClient } from './client';
import { tokenStorage } from './tokenStorage';

function diagnosticarErroRecomendacoes(error, metodo, caminho, operacao) {
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

async function requestWithSession(request, diagnostico) {
  const session = await tokenStorage.captureSession();
  if (!session) throw new Error('Usuário não autenticado');
  tokenStorage.assertSession(session.id);
  try {
    const response = await request({ rf017SessionId: session.id, signal: session.signal });
    tokenStorage.assertSession(session.id);
    return response.data;
  } catch (error) {
    diagnosticarErroRecomendacoes(error, diagnostico.metodo, diagnostico.caminho, diagnostico.operacao);
    throw error;
  }
}

export function listarRecomendacoes(params = {}) {
  return requestWithSession((config) => apiClient.get('/recomendacoes', { ...config, params }), {
    metodo: 'GET', caminho: '/recomendacoes', operacao: 'listar',
  });
}

export function atualizarStatusRecomendacao(id, status) {
  return requestWithSession((config) => apiClient.patch(`/recomendacoes/${id}/status`, { status }, config), {
    metodo: 'PATCH', caminho: `/recomendacoes/${id}/status`, operacao: 'atualizar_status',
  });
}

export function obterContextoRecomendacao(id) {
  return requestWithSession((config) => apiClient.get(`/recomendacoes/${id}/conversa`, config), {
    metodo: 'GET', caminho: `/recomendacoes/${id}/conversa`, operacao: 'obter_contexto',
  });
}
