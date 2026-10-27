import { apiClient } from './client';
import { tokenStorage } from './tokenStorage';

async function requestWithSession(request) {
  const session = await tokenStorage.captureSession();
  if (!session) throw new Error('Usuário não autenticado');

  tokenStorage.assertSession(session.id);
  const response = await request({
    rf017SessionId: session.id,
    signal: session.signal,
  });
  tokenStorage.assertSession(session.id);
  return response.data;
}

export function listarMemorias(params = {}) {
  return requestWithSession(config => apiClient.get('/memorias', {
    ...config,
    params,
  }));
}

export function criarMemoria(conteudo) {
  return requestWithSession(config => apiClient.post('/memorias', {
    conteudo,
    origem: 'DECLARADA',
  }, config));
}

export function atualizarMemoria(memoriaId, dados) {
  return requestWithSession(config => apiClient.patch(`/memorias/${memoriaId}`, dados, config));
}

export function inativarMemoria(memoriaId) {
  return requestWithSession(config => apiClient.post(`/memorias/${memoriaId}/inativar`, {}, config));
}

export function excluirMemoria(memoriaId) {
  return requestWithSession(config => apiClient.delete(`/memorias/${memoriaId}`, config));
}
