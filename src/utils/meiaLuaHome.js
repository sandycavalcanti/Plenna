export const CORES_ORCAMENTO = {
  VERDE: '#267344',
  AMARELO: '#926500',
  LARANJA: '#A64C14',
  VERMELHO: '#B32646',
  NEUTRO: '#76658A',
};

export function apresentarMeiaLua(dados, orcamentoFixoCentavos = null) {
  const financeiro = dados?.financeiro;
  const orcamento = dados?.orcamento;
  const hasFixedBudget = Number.isSafeInteger(orcamentoFixoCentavos) && orcamentoFixoCentavos > 0;
  const configuredBudget = hasFixedBudget
    ? orcamentoFixoCentavos
    : typeof orcamento?.valorCentavos === 'number' && Number.isFinite(orcamento.valorCentavos) && orcamento.valorCentavos > 0
      ? orcamento.valorCentavos
      : null;
  const historicalUnavailable = ['ORCAMENTO_HISTORICO_NAO_COMPROVADO', 'HISTORICO_INDISPONIVEL'].includes(orcamento?.motivo);
  const referenceUsable = orcamento?.disponibilidade === 'REFERENCIA_ATUAL'
    || (orcamento?.disponibilidade === 'REFERENCIA_HISTORICA'
      && ['MES_COMPROVADO', 'REFERENCIA_OBSERVADA', 'CONTINUIDADE_COMPROVADA'].includes(orcamento?.vigencia));
  const budgetUsable = configuredBudget !== null
    && (hasFixedBudget || referenceUsable)
    && ['COMPLETO', 'PARCIAL', 'SEM_COMPRAS'].includes(financeiro?.qualidade);
  const coverageComplete = financeiro?.qualidade === 'COMPLETO'
    && financeiro?.cobertura === 'COMPLETA';
  const knownTotal = typeof financeiro?.totalConhecidoCentavos === 'number' && Number.isFinite(financeiro.totalConhecidoCentavos)
    ? financeiro.totalConhecidoCentavos
    : null;
  const percentFromPeriod = hasFixedBudget && knownTotal !== null
    ? (knownTotal / configuredBudget) * 100
    : orcamento?.percentualConhecido;
  const percentual = budgetUsable
    && typeof percentFromPeriod === 'number'
    && Number.isFinite(percentFromPeriod)
    && percentFromPeriod >= 0
    ? percentFromPeriod
    : null;
  const state = percentual === null
    ? 'NEUTRO'
    : percentual > 100
      ? 'VERMELHO'
      : !coverageComplete
        ? 'NEUTRO'
        : percentual < 50
          ? 'VERDE'
          : percentual < 75
            ? 'AMARELO'
            : 'LARANJA';
  const messages = {
    VERDE: 'Faixa inicial do orçamento registrado',
    AMARELO: 'Acompanhe o orçamento utilizado',
    LARANJA: percentual === 100 ? 'Orçamento atingido nos registros' : 'Faixa próxima ao orçamento',
    VERMELHO: 'Total conhecido acima do orçamento',
    NEUTRO: 'Cobertura parcial ou desconhecida; acompanhe os valores registrados',
  };
  const excesso = percentual !== null && knownTotal !== null && knownTotal > configuredBudget
    ? knownTotal - configuredBudget
    : percentual !== null && !hasFixedBudget && orcamento?.excessoConhecidoCentavos > 0
      ? orcamento.excessoConhecidoCentavos
      : null;

  return {
    percentual,
    progresso: percentual === null ? 0 : Math.min(1, percentual / 100),
    cor: CORES_ORCAMENTO[state],
    estado: state,
    mensagem: historicalUnavailable && !hasFixedBudget
      ? 'Orçamento deste mês não disponível'
      : !budgetUsable
        ? (financeiro?.qualidade === 'INSUFICIENTE' ? 'Valor não informado' : 'Orçamento mensal não disponível')
        : messages[state],
    excesso,
    restante: percentual === null || knownTotal === null ? null : Math.max(0, configuredBudget - knownTotal),
    compras: financeiro?.qualidade === 'INSUFICIENTE' ? null : knownTotal,
    orcamento: hasFixedBudget || budgetUsable ? configuredBudget : null,
  };
}
