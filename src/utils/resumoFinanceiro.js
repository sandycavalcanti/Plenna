export const BUSINESS_TIMEZONE = 'America/Sao_Paulo';

export function periodoMensalSaoPaulo(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}
export function apresentarResumoFinanceiro(resumo, loading = false, error = false) {
  if (loading || error || !resumo) return { total: null, orcamento: null, titulo: error ? 'Erro ao carregar resumo' : 'Carregando resumo', mensagem: error ? 'Tente atualizar novamente' : '', subtitulo: '', alerta: true };
  const partial = resumo.qualidade === 'PARCIAL';
  const insufficient = resumo.qualidade === 'INSUFICIENTE';
  const state = resumo.estadoOrcamento;
  return { total: insufficient ? null : resumo.total, orcamento: resumo.orcamentoMensal,
    titulo: insufficient ? 'Valor não informado' : partial ? 'Gasto confirmado parcial' : resumo.qualidade === 'SEM_COMPRAS' ? 'Sem compras confirmadas' : 'Gasto confirmado',
    mensagem: partial || insufficient ? `${resumo.comprasSemValor} compra(s) sem valor informado` : 'Total das compras com valor informado',
    subtitulo: state === 'SEM_ORCAMENTO' ? 'Sem orçamento definido' : state === 'EXCEDIDO' ? 'Orçamento excedido' : state === 'ATINGIDO' ? 'Orçamento atingido' : state === 'INDETERMINADO' ? 'Dados insuficientes para concluir' : 'Dentro do orçamento',
    alerta: partial || insufficient || state === 'EXCEDIDO' || state === 'INDETERMINADO' };
}

// Presentation only: totals and eligibility are supplied by the API.
export function apresentarEstadoOrcamento(resumo, loading = false, error = false, cobertura = 'DESCONHECIDA') {
  const neutral = (mensagem, percentual = null) => ({ estado: 'NEUTRO', cor: '#76658A', mensagem, percentual, progresso: percentual === null ? 0 : Math.max(0, Math.min(1, percentual / 100)) });
  if (loading) return neutral('Carregando orçamento');
  if (error || !resumo) return neutral('Resumo indisponível. Tente novamente.');
  const budget = resumo.orcamentoMensal;
  const total = resumo.totalConhecido;
  if (typeof budget !== 'number' || !Number.isFinite(budget) || budget <= 0) return neutral('Orçamento mensal não informado');
  if (typeof total !== 'number' || !Number.isFinite(total) || total < 0 || resumo.qualidade === 'INSUFICIENTE') return neutral('Valores insuficientes para calcular o percentual');
  const percentual = total / budget * 100;
  if (!Number.isFinite(percentual)) return neutral('Percentual indisponível');
  if (percentual > 100) return { estado: 'VERMELHO', cor: '#B32646', mensagem: 'Total conhecido acima do orçamento', percentual, progresso: 1 };
  if (resumo.qualidade === 'PARCIAL' || cobertura !== 'COMPLETA') return neutral('Acompanhe os valores registrados; cobertura incompleta ou desconhecida', percentual);
  if (percentual < 50) return { estado: 'VERDE', cor: '#267344', mensagem: 'Faixa inicial do orçamento registrado', percentual, progresso: percentual / 100 };
  if (percentual < 75) return { estado: 'AMARELO', cor: '#926500', mensagem: 'Acompanhe o orçamento utilizado', percentual, progresso: percentual / 100 };
  return { estado: 'LARANJA', cor: '#A64C14', mensagem: percentual === 100 ? 'Orçamento atingido' : 'Faixa próxima ao limite', percentual, progresso: percentual / 100 };
}
