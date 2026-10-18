import { apiClient } from './client';

export const CHAT_MAX_MESSAGE_CHARS = 4000;

export async function listHistories() {
  const response = await apiClient.get('/historicos');
  return Array.isArray(response.data) ? response.data : [];
}

export async function deleteHistory(historicoId) {
  const response = await apiClient.delete(`/historicos/${encodeURIComponent(historicoId)}`);
  return response.data;
}

export async function getHistory(historicoId) {
  const response = await apiClient.get(`/historicos/${encodeURIComponent(historicoId)}`);
  return response.data;
}

export async function sendMessage(historicoId, texto) {
  const response = await apiClient.post(
    `/historicos/${encodeURIComponent(historicoId)}/mensagens`,
    { texto },
  );
  return response.data;
}

export async function sendFirstMessage(texto) {
  const response = await apiClient.post('/historicos/mensagens', { texto });
  return response.data;
}

export function getChatErrorMessage(error, fallback = 'Não foi possível concluir a operação.') {
  const status = error?.response?.status;

  if (error?.code === 'RF017_SESSION_INVALIDATED') return 'Sua sessão expirou. Entre novamente para continuar.';
  if (status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  if (status === 404) return 'Esta conversa não está disponível.';
  if (status === 502 || status === 504) {
    return 'A IA não conseguiu responder agora. Sua mensagem pode ter sido salva; o histórico foi atualizado.';
  }
  if (status === 400) return 'Confira os dados enviados e tente novamente.';
  if (!error?.response) return 'Não foi possível conectar ao Plenna. Verifique sua internet.';

  return fallback;
}
