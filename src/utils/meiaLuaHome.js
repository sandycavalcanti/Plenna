export const CORES_ORCAMENTO = {VERDE:'#267344',AMARELO:'#926500',LARANJA:'#A64C14',VERMELHO:'#B32646',NEUTRO:'#76658A'};
const colors = CORES_ORCAMENTO;
export function apresentarMeiaLua(dados) {
  const f=dados?.financeiro, b=dados?.orcamento;
  const historical=b?.motivo==='ORCAMENTO_HISTORICO_NAO_COMPROVADO';
  const usable=(b?.disponibilidade==='REFERENCIA_ATUAL'||b?.disponibilidade==='REFERENCIA_HISTORICA'&&['MES_COMPROVADO','REFERENCIA_OBSERVADA','CONTINUIDADE_COMPROVADA'].includes(b?.vigencia)) && typeof b.valorCentavos==='number' && Number.isFinite(b.valorCentavos) && b.valorCentavos>0;
  const percent=usable && ['COMPLETO','PARCIAL','SEM_COMPRAS'].includes(f?.qualidade) && typeof b.percentualConhecido==='number' && Number.isFinite(b.percentualConhecido) && b.percentualConhecido>=0 ? b.percentualConhecido : null;
  // Original integration bands describe known budget utilization, regardless of coverage.
  const state=percent===null ? 'NEUTRO' : percent>100?'VERMELHO':percent<50?'VERDE':percent<75?'AMARELO':'LARANJA';
  const messages={VERDE:'Faixa inicial do orçamento registrado',AMARELO:'Acompanhe o orçamento utilizado',LARANJA:percent===100?'Orçamento atingido nos registros':'Faixa próxima ao orçamento',VERMELHO:'Total conhecido acima do orçamento',NEUTRO:'Cobertura parcial ou desconhecida; acompanhe os valores registrados'};
  return {percentual:percent,progresso:percent===null?0:Math.min(1,percent/100),cor:colors[state],estado:state,
    mensagem:historical?'Orçamento deste mês não disponível':!usable?(f?.qualidade==='INSUFICIENTE'?'Valor não informado':'Orçamento mensal não disponível'):messages[state],
    excesso:percent!==null && b.excessoConhecidoCentavos>0?b.excessoConhecidoCentavos:null,
    restante:percent===null||typeof f?.totalConhecidoCentavos!=='number'?null:Math.max(0,b.valorCentavos-f.totalConhecidoCentavos),
    compras:f?.qualidade==='INSUFICIENTE'?null:f?.totalConhecidoCentavos??null,
    orcamento:usable?b.valorCentavos:null };
}
