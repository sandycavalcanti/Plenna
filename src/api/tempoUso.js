import { apiClient } from './client';

export async function sincronizarTempoUso(payload, config) {
  const response = await apiClient.put('/tempo-uso/sync', payload, config);
  return response.data;
}

export async function listarAplicativosTempoUso(config) {
  try {
    const response = await apiClient.get('/tempo-uso/aplicativos', config);
    return response.data;
  } catch (error) {
    // Diagnóstico temporário monitoramento de tempo em aplicativos: somente metadados permitidos em desenvolvimento.
    if (__DEV__) {
      const status = error?.response?.status;
      console.log('USAGE_MONITORING_HTTP_ERROR', {
        operacao: 'listarAplicativosTempoUso',
        metodo: 'GET',
        path: '/tempo-uso/aplicativos',
        status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
      });
    }
    throw error;
  }
}
