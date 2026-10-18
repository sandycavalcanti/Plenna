import { apiClient } from './client';

/**
 * Consulta os agregados financeiros do RF016.
 * A API continua responsável por ownership, filtros financeiros e agregações;
 * o aplicativo apenas envia o período solicitado e apresenta a resposta.
 */
export async function getDashboardAnalytics(params, config = {}) {
  const response = await apiClient.get('/dashboard/analytics', {
    ...config,
    params,
  });

  return response.data;
}
