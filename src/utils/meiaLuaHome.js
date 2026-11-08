export const CORES_ORCAMENTO = {
  VERDE: '#267344',
  AMARELO: '#926500',
  LARANJA: '#A64C14',
  VERMELHO: '#B32646',
  NEUTRO: '#76658A',
};

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

  // Com orçamento fixo, cobertura parcial não é apresentada como faixa
  // confirmada. A chamada sem orçamento fixo conserva as faixas do indicador
  // consolidado quando a API já forneceu percentual comprovado.
  const partialFixedReference = hasFixedBudget && (f?.qualidade === 'PARCIAL' || f?.cobertura !== 'COMPLETA');
  const state = percent === null || partialFixedReference
    ? 'NEUTRO'
    : percent > 100
      ? 'VERMELHO'
      : percent < 50
        ? 'VERDE'
        : percent < 75
          ? 'AMARELO'
          : 'LARANJA';
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
