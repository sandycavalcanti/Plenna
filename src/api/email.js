import { apiClient } from './client';

export async function consultarStatusEmail(config) {
  const response = await apiClient.get('/email/status', config);
  return response.data;
}

export async function iniciarConexaoEmail(config) {
  const response = await apiClient.get('/email/connect', config);
  return response.data;
}
