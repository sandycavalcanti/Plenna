import { apiClient } from './client';
import { tokenStorage } from './tokenStorage';

function validarAnalytics(data, params) {
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const month = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  let expected;
  if (params.mode === 'month') expected = [params.month];
  else if (params.mode === 'compare') expected = [params.monthA, params.monthB];
  else if (params.mode === 'evolution' && month(params.end) && [6, 12].includes(params.months)) {
    const [year, endMonth] = params.end.split('-').map(Number);
    expected = Array.from({ length: params.months }, (_, index) =>
      new Date(Date.UTC(year, endMonth - params.months + index, 1)).toISOString().slice(0, 7));
  }
  const valid = expected?.every(month) && data?.mode === params.mode && data.timezone === 'America/Sao_Paulo' &&
    Array.isArray(data.periodos) && data.periodos.length === expected.length &&
    data.periodos.every((period, index) => period?.periodo === expected[index] &&
      typeof period.inicio === 'string' && Number.isFinite(Date.parse(period.inicio)) &&
      typeof period.fim === 'string' && Date.parse(period.fim) > Date.parse(period.inicio) &&
      ['total_centavos', 'desconto_centavos', 'quantidade_compras', 'quantidade_compras_com_valor'].every(key => integer(period[key])) &&
      ['total', 'desconto'].every(key => number(period[key])) &&
      period.quantidade_compras_com_valor <= period.quantidade_compras &&
      Array.isArray(period.categorias) && period.categorias.every(item => item && integer(item.categoria_id) && item.categoria_id > 0 &&
        typeof item.categoria_nome === 'string' && Number.isSafeInteger(item.total_centavos) && Number.isFinite(item.total) && integer(item.quantidade_itens)) &&
      Array.isArray(period.formas_pagamento) && period.formas_pagamento.every(item => item && typeof item.forma_pagamento_nome === 'string' &&
        Number.isSafeInteger(item.total_centavos) && Number.isFinite(item.total) && integer(item.quantidade_compras)) &&
      integer(period.compras_acima_limite?.acima_limite) && integer(period.compras_acima_limite?.dentro_limite) &&
      Array.isArray(period.impulsividade) && period.impulsividade.every(item => item &&
        ['PENDENTE', 'IMPULSIVA', 'NAO_IMPULSIVA'].includes(item.compra_classificacao) &&
        integer(item.quantidade) && integer(item.valor_total_centavos) && number(item.valor_total))) &&
    (params.mode === 'compare' ? data.comparacao?.periodo_base === params.monthA &&
      data.comparacao.periodo_comparado === params.monthB && Array.isArray(data.comparacao.categorias) &&
      ['total', 'quantidade_compras'].every(key => integer(data.comparacao[key]?.base) && integer(data.comparacao[key]?.comparado) &&
        Number.isSafeInteger(data.comparacao[key]?.diferenca) &&
        (data.comparacao[key]?.variacao_percentual === null || Number.isFinite(data.comparacao[key]?.variacao_percentual)))
      : data.comparacao === null);
  if (!valid) {
    const error = new Error('Não foi possível validar os indicadores deste período. Tente novamente.');
    error.code = 'INVALID_DASHBOARD_CONTRACT';
    throw error;
  }
  return data;
}

/**
 * Consulta os agregados financeiros do RF016.
 * A API continua responsável por ownership, filtros financeiros e agregações;
 * o aplicativo apenas envia o período solicitado e apresenta a resposta.
 */
export async function getDashboardAnalytics(params, config = {}) {
  const session = await tokenStorage.captureSession();
  if (!session) throw new Error('SESSION_REQUIRED');
  tokenStorage.assertSession(session.id);

  try {
    const response = await apiClient.get('/dashboard/analytics', {
      ...config,
      params,
      signal: config.signal ?? session.signal,
      usageMonitoringSessionId: session.id,
    });
    tokenStorage.assertSession(session.id);
    return validarAnalytics(response.data, params);
  } catch (error) {
    tokenStorage.assertSession(session.id);
    throw error;
  }
}
