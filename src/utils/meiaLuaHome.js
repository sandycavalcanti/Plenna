const colors = {VERDE:'#267344',AMARELO:'#926500',LARANJA:'#A64C14',VERMELHO:'#B32646',NEUTRO:'#76658A'};
export function apresentarMeiaLua(dados, orcamentoFixoCentavos = null) {
  const f=dados?.financeiro, b=dados?.orcamento;
  const hasFixedBudget = Number.isSafeInteger(orcamentoFixoCentavos) && orcamentoFixoCentavos > 0;
  const configuredBudget = hasFixedBudget
    ? orcamentoFixoCentavos
    : typeof b?.valorCentavos === 'number' && b.valorCentavos > 0 ? b.valorCentavos : null;
  const historical=b?.motivo==='ORCAMENTO_HISTORICO_NAO_COMPROVADO' && !hasFixedBudget;
  const budgetUsable = configuredBudget !== null && (!hasFixedBudget ? b?.disponibilidade==='REFERENCIA_ATUAL' : true) && f?.qualidade!=='INSUFICIENTE';
  const knownTotal = typeof f?.totalConhecidoCentavos === 'number' && Number.isFinite(f.totalConhecidoCentavos) ? f.totalConhecidoCentavos : null;
  const percentFromPeriod = hasFixedBudget && knownTotal !== null
    ? (knownTotal / configuredBudget) * 100
    : b?.percentualConhecido;
  const percent=budgetUsable && typeof percentFromPeriod==='number' && Number.isFinite(percentFromPeriod) && percentFromPeriod>=0 ? percentFromPeriod : null;
  const state=percent===null ? 'NEUTRO' : percent>100?'VERMELHO':f.qualidade==='PARCIAL'||f.cobertura!=='COMPLETA'?'NEUTRO':percent<50?'VERDE':percent<75?'AMARELO':'LARANJA';
  const messages={VERDE:'Faixa inicial do orçamento registrado',AMARELO:'Acompanhe o orçamento utilizado',LARANJA:percent===100?'Orçamento atingido nos registros':'Faixa próxima ao orçamento',VERMELHO:'Total conhecido acima do orçamento',NEUTRO:'Cobertura parcial ou desconhecida; acompanhe os valores registrados'};
  return {percentual:percent,progresso:percent===null?0:Math.min(1,percent/100),cor:colors[state],estado:state,
    mensagem:historical?'Orçamento deste mês não disponível':!budgetUsable?(f?.qualidade==='INSUFICIENTE'?'Valor não informado':'Orçamento mensal não disponível'):messages[state],
    excesso:percent!==null && knownTotal !== null && knownTotal > configuredBudget ? knownTotal - configuredBudget : null,
    restante:percent===null||knownTotal===null?null:Math.max(0,configuredBudget-knownTotal),
    compras:f?.qualidade==='INSUFICIENTE'?null:f?.totalConhecidoCentavos??null,
    orcamento:configuredBudget };
}
