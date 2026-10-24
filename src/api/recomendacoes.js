import { apiClient } from './client';
import { tokenStorage } from './tokenStorage';

async function requestWithSession(request) {
  const session = await tokenStorage.captureSession();
  if (!session) throw new Error('Usuário não autenticado');
  tokenStorage.assertSession(session.id);
  const response = await request({ rf017SessionId: session.id, signal: session.signal });
  tokenStorage.assertSession(session.id);
  return response.data;
}

export function listarRecomendacoes(params = {}) {
  return requestWithSession((config) => apiClient.get('/recomendacoes', { ...config, params }));
}

export function atualizarStatusRecomendacao(id, status) {
  return requestWithSession((config) => apiClient.patch(`/recomendacoes/${id}/status`, { status }, config));
}

export function obterContextoRecomendacao(id) {
  return requestWithSession((config) => apiClient.get(`/recomendacoes/${id}/conversa`, config));
}
