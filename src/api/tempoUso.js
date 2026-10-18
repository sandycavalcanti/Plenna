import { apiClient } from './client';

export async function sincronizarTempoUso(_payload, _config) {
  // Bloqueio incondicional nesta etapa, inclusive em builds de produção.
  if (__DEV__) {
    console.log('RF017 LAB: envio de tempo de uso bloqueado.');
  }

  return {
    recebidos: 0,
    persistidos: 0,
    bloqueadoNoLaboratorio: true,
  };

}

export async function listarAplicativosTempoUso(config) {
  try {
    const response = await apiClient.get('/tempo-uso/aplicativos', config);
    return response.data;
  } catch (error) {
    // Diagnóstico temporário RF017: somente metadados permitidos em desenvolvimento.
    if (__DEV__) {
      const status = error?.response?.status;
      console.log('RF017 HTTP ERROR', {
        operacao: 'listarAplicativosTempoUso',
        metodo: 'GET',
        path: '/tempo-uso/aplicativos',
        status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
      });
    }
    throw error;
  }
}
