const exact = (object, keys) => object && typeof object === 'object' && !Array.isArray(object) && Object.keys(object).length === keys.length && Object.keys(object).every(key => keys.includes(key));
export function validarResumoHome(data, periodo) {
  const fail = () => { throw new Error('INVALID_HOME_CONTRACT'); };
  if (!exact(data, ['versaoContrato','periodo','referenciaTemporal','seletor','financeiro','orcamento','limitacoes','perspectivas']) || data.versaoContrato !== 1 || data.periodo !== periodo || data.referenciaTemporal !== 'America/Sao_Paulo') fail();
  if (!exact(data.financeiro, ['comprasConfirmadas','comprasComValor','comprasSemValor','totalConhecidoCentavos','totalCentavos','qualidade','cobertura'])) fail();
  if (!exact(data.orcamento, ['disponibilidade','valorCentavos','percentualConhecido','excessoConhecidoCentavos','vigencia','estadoUtilizacao','motivo'])) fail();
  if (!exact(data.seletor, ['periodoMinimo','periodoMaximo','motivoLimiteInicial'])) fail();
  if (!exact(data.perspectivas, ['categorias','pagamentos','estabelecimentos'])) fail();
  for (const key of ['categorias','pagamentos','estabelecimentos']) {
    const p = data.perspectivas[key];
    if (!exact(p, ['disponibilidade','motivo']) || p.disponibilidade !== 'INDISPONIVEL' || p.motivo !== (key === 'estabelecimentos' ? 'SEM_IDENTIFICACAO_CONFIAVEL' : 'POLITICA_DE_PRIVACIDADE_NAO_VERIFICAVEL')) fail();
  }
  for (const key of ['periodoMinimo','periodoMaximo']) if (typeof data.seletor[key] !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(data.seletor[key])) fail();
  if (!['CRIACAO_CONTA','COMPRA_RETROATIVA','DATA_CRIACAO_INDISPONIVEL'].includes(data.seletor.motivoLimiteInicial)) fail();
  if (!['ATUAL_SEM_HISTORICO','NAO_COMPROVADA'].includes(data.orcamento.vigencia) || (data.orcamento.motivo !== null && typeof data.orcamento.motivo !== 'string')) fail();
  const f = data.financeiro, b = data.orcamento;
  for (const key of ['comprasConfirmadas','comprasComValor','comprasSemValor']) if (!Number.isSafeInteger(f[key]) || f[key] < 0) fail();
  for (const value of [f.totalConhecidoCentavos,f.totalCentavos,b.valorCentavos,b.excessoConhecidoCentavos]) if (value !== null && (!Number.isSafeInteger(value) || value < 0)) fail();
  if (!['COMPLETO','PARCIAL','INSUFICIENTE','SEM_COMPRAS'].includes(f.qualidade) || !['COMPLETA','PARCIAL','DESCONHECIDA'].includes(f.cobertura)) fail();
  if (!['REFERENCIA_ATUAL','INDISPONIVEL'].includes(b.disponibilidade) || !['VERDE','AMARELO','LARANJA','VERMELHO','NEUTRO'].includes(b.estadoUtilizacao)) fail();
  if (b.percentualConhecido !== null && (typeof b.percentualConhecido !== 'number' || !Number.isFinite(b.percentualConhecido) || b.percentualConhecido < 0)) fail();
  if (b.disponibilidade === 'INDISPONIVEL' && (b.valorCentavos !== null || b.percentualConhecido !== null || b.excessoConhecidoCentavos !== null || b.estadoUtilizacao !== 'NEUTRO')) fail();
  if (!Array.isArray(data.limitacoes) || !data.limitacoes.every(value => typeof value === 'string')) fail();
  return data;
}
export function financeiroHome(data) {
  if (!data) return null;
  const f = data.financeiro, b = data.orcamento;
  const currency = value => value === null ? null : value / 100;
  return { total: currency(f.totalCentavos), totalConhecido: currency(f.totalConhecidoCentavos),
    orcamentoMensal: currency(b.valorCentavos), qualidade: f.qualidade, comprasSemValor: f.comprasSemValor,
    estadoOrcamento: b.disponibilidade === 'INDISPONIVEL' ? 'SEM_ORCAMENTO' : b.percentualConhecido === null ? 'INDETERMINADO' : b.percentualConhecido > 100 ? 'EXCEDIDO' : b.percentualConhecido === 100 ? 'ATINGIDO' : 'DENTRO' };
}
