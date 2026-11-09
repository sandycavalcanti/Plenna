export const CORES_ORCAMENTO = {
  VERDE: '#267344',
  AMARELO: '#926500',
  LARANJA: '#A64C14',
  VERMELHO: '#B32646',
  NEUTRO: '#76658A',
};

const LIMITES_PERCENTUAIS = {
  ORCAMENTO: { amarelo: 50, laranja: 75, vermelho: 100 },
  RISCO: { amarelo: 25, laranja: 50, vermelho: 75 },
};

export function faixaPorPercentual(percentual, perfil = 'ORCAMENTO') {
  const valor = Number(percentual);
  if (!Number.isFinite(valor) || valor < 0) return 'NEUTRO';
  const limites = LIMITES_PERCENTUAIS[perfil] || LIMITES_PERCENTUAIS.ORCAMENTO;

  if (perfil === 'RISCO') {
    if (valor >= limites.vermelho) return 'VERMELHO';
    if (valor > limites.laranja) return 'LARANJA';
    if (valor > limites.amarelo) return 'AMARELO';
    return 'VERDE';
  }
  if (valor > limites.vermelho) return 'VERMELHO';
  if (valor >= limites.laranja) return 'LARANJA';
  if (valor >= limites.amarelo) return 'AMARELO';
  return 'VERDE';
}

export function corPorPercentual(percentual, perfil = 'ORCAMENTO') {
  return CORES_ORCAMENTO[faixaPorPercentual(percentual, perfil)];
}

export function corPorProporcao(parte, total, perfil = 'RISCO') {
  const numerador = Number(parte);
  const denominador = Number(total);
  if (!Number.isFinite(numerador) || !Number.isFinite(denominador) || denominador <= 0) {
    return CORES_ORCAMENTO.NEUTRO;
  }
  return corPorPercentual((numerador / denominador) * 100, perfil);
}

const colors = CORES_ORCAMENTO;

/**
 * Apresenta somente valores comprovados pelo resumo financeiro.
 *
 * A Home pode fornecer um orçamento fixo da configuração atual. Nesse caso,
 * o valor conhecido do período é comparado a essa referência, sem converter
 * cobertura parcial em uma afirmação de orçamento histórico. Quando não há
 * orçamento fixo, a referência calculada pela API só é usada se a vigência
 * estiver explicitamente comprovada.
 */
export function apresentarMeiaLua(dados, orcamentoFixoCentavos = null) {
  const f = dados?.financeiro;
  const b = dados?.orcamento;
  const hasFixedBudget = Number.isSafeInteger(orcamentoFixoCentavos) && orcamentoFixoCentavos > 0;
  const apiBudget = typeof b?.valorCentavos === 'number' && Number.isFinite(b.valorCentavos) && b.valorCentavos > 0
    ? b.valorCentavos
    : null;
  const usableApiBudget = apiBudget !== null && (
    b?.disponibilidade === 'REFERENCIA_ATUAL'
    || (b?.disponibilidade === 'REFERENCIA_HISTORICA' && ['MES_COMPROVADO', 'REFERENCIA_OBSERVADA', 'CONTINUIDADE_COMPROVADA'].includes(b?.vigencia))
  );
  const configuredBudget = hasFixedBudget ? orcamentoFixoCentavos : usableApiBudget ? apiBudget : null;
  const historical = b?.motivo === 'ORCAMENTO_HISTORICO_NAO_COMPROVADO' && !hasFixedBudget;
  const knownTotal = typeof f?.totalConhecidoCentavos === 'number' && Number.isFinite(f.totalConhecidoCentavos)
    ? f.totalConhecidoCentavos
    : null;
  const qualityAllowsPercentage = ['COMPLETA', 'COMPLETO', 'PARCIAL', 'SEM_COMPRAS'].includes(f?.qualidade);
  const percentFromPeriod = hasFixedBudget && knownTotal !== null
    ? (knownTotal / configuredBudget) * 100
    : b?.percentualConhecido;
  const percent = configuredBudget !== null && qualityAllowsPercentage && typeof percentFromPeriod === 'number'
    && Number.isFinite(percentFromPeriod) && percentFromPeriod >= 0
    ? percentFromPeriod
    : null;

  // A cor representa o percentual conhecido do orçamento.
  const state =
  percent === null
    ? 'NEUTRO'
    : faixaPorPercentual(percent, 'ORCAMENTO');
  const messages = {
    VERDE: 'Faixa inicial do orçamento registrado',
    AMARELO: 'Acompanhe o orçamento utilizado',
    LARANJA: percent === 100 ? 'Orçamento atingido nos registros' : 'Faixa próxima ao orçamento',
    VERMELHO: 'Total conhecido acima do orçamento',
    NEUTRO: 'Cobertura parcial ou desconhecida; acompanhe os valores registrados',
  };
  const excessFromApi = typeof b?.excessoConhecidoCentavos === 'number' && b.excessoConhecidoCentavos > 0
    ? b.excessoConhecidoCentavos
    : null;
  const excesso = percent === null
    ? null
    : knownTotal !== null && knownTotal > configuredBudget
      ? knownTotal - configuredBudget
      : excessFromApi;

  return {
    percentual: percent,
    progresso: percent === null ? 0 : Math.min(1, percent / 100),
    cor: colors[state],
    estado: state,
    mensagem: f?.qualidade === 'INSUFICIENTE'
      ? 'Valor não informado'
      : historical
        ? 'Orçamento deste mês não disponível'
      : configuredBudget === null
        ? f?.qualidade === 'INSUFICIENTE' ? 'Valor não informado' : 'Orçamento mensal não disponível'
        : messages[state],
    excesso,
    restante: percent === null || knownTotal === null ? null : Math.max(0, configuredBudget - knownTotal),
    compras: f?.qualidade === 'INSUFICIENTE' ? null : knownTotal,
    orcamento: configuredBudget,
  };
}
