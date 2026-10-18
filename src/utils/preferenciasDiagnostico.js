const etapas = {
  VALIDACAO: {},
  CADASTRO_USUARIO: { metodo: 'POST', rota: '/auth/register' },
  LOGIN: { metodo: 'POST', rota: '/auth/login' },
  SESSAO: {},
  CATALOGO: { metodo: 'GET', rota: '/categories' },
  CARREGAMENTO_USUARIO: { metodo: 'GET', rota: '/users/user' },
  CARREGAMENTO_PREFERENCIAS: { metodo: 'GET', rota: '/preferencia' },
  USUARIO: { metodo: 'PUT', rota: '/users' },
  PREFERENCIAS: { metodo: 'PUT', rota: '/preferencia/bulk' },
};
const codigosLocais = new Set(['CATALOGO_INVALIDO', 'VALOR_MONETARIO_INVALIDO', 'PREFERENCIAS_INVALIDAS']);
const codigosTransporte = new Set(['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT', 'ERR_CANCELED']);

export function diagnosticarFalhaPreferencias(error, etapa, fluxo) {
  const etapaSegura = Object.hasOwn(etapas, etapa) ? etapa : 'VALIDACAO';
  const local = etapaSegura === 'VALIDACAO' || etapaSegura === 'SESSAO' || codigosLocais.has(error?.code);
  const status = !local && Number.isInteger(error?.response?.status) && error.response.status >= 100 && error.response.status <= 599
    ? error.response.status : undefined;
  return {
    fluxo: fluxo === 'CADASTRO' ? 'CADASTRO' : 'EDICAO',
    etapa: etapaSegura,
    ...(!local ? etapas[etapaSegura] : {}),
    ...(status ? { status } : {}),
    codigo: local ? (codigosLocais.has(error?.code) ? error.code : 'VALIDACAO_LOCAL')
      : status ? 'ERRO_HTTP' : codigosTransporte.has(error?.code) ? error.code : 'SEM_RESPOSTA',
  };
}

export function registrarFalhaPreferencias(error, etapa, fluxo) {
  console.error('Falha nas preferências', diagnosticarFalhaPreferencias(error, etapa, fluxo));
}

export function mensagemValidacaoPreferencias(error) {
  if (error?.code === 'CATALOGO_INVALIDO') return 'Não foi possível validar as categorias. Tente carregar o catálogo novamente.';
  if (error?.code === 'VALOR_MONETARIO_INVALIDO') return 'Use valores de até R$ 99.999.999,99 e no máximo duas casas decimais.';
  return 'Confira se o orçamento é positivo e se os limites das categorias respeitam o cadeado.';
}
