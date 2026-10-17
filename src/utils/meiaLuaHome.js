const colors = {VERDE:'#267344',AMARELO:'#926500',LARANJA:'#A64C14',VERMELHO:'#B32646',NEUTRO:'#76658A'};
export function apresentarMeiaLua(dados) {
  const f=dados?.financeiro, b=dados?.orcamento;
  const historical=b?.motivo==='ORCAMENTO_HISTORICO_NAO_COMPROVADO';
  const usable=b?.disponibilidade==='REFERENCIA_ATUAL' && typeof b.valorCentavos==='number' && b.valorCentavos>0 && f?.qualidade!=='INSUFICIENTE';
  const percent=usable && typeof b.percentualConhecido==='number' && Number.isFinite(b.percentualConhecido) && b.percentualConhecido>=0 ? b.percentualConhecido : null;
  const state=percent===null ? 'NEUTRO' : percent>100?'VERMELHO':f.qualidade==='PARCIAL'||f.cobertura!=='COMPLETA'?'NEUTRO':percent<50?'VERDE':percent<75?'AMARELO':'LARANJA';
  const messages={VERDE:'Faixa inicial do orçamento registrado',AMARELO:'Acompanhe o orçamento utilizado',LARANJA:percent===100?'Orçamento atingido nos registros':'Faixa próxima ao orçamento',VERMELHO:'Total conhecido acima do orçamento',NEUTRO:'Cobertura parcial ou desconhecida; acompanhe os valores registrados'};
  return {percentual:percent,progresso:percent===null?0:Math.min(1,percent/100),cor:colors[state],estado:state,
    mensagem:historical?'Orçamento deste mês não disponível':!usable?(f?.qualidade==='INSUFICIENTE'?'Valor não informado':'Orçamento mensal não disponível'):messages[state],
    excesso:percent!==null && b.excessoConhecidoCentavos>0?b.excessoConhecidoCentavos:null,
    restante:percent===null||typeof f?.totalConhecidoCentavos!=='number'?null:Math.max(0,b.valorCentavos-f.totalConhecidoCentavos),
    compras:f?.qualidade==='INSUFICIENTE'?null:f?.totalConhecidoCentavos??null,
    orcamento:usable?b.valorCentavos:null };
}
