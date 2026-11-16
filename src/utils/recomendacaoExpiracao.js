function timestampFromDateValue(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value !== 'string' || value.trim() === '') return NaN;
  return Date.parse(value);
}

/**
 * Usa o instante recebido pela API. Datas nulas, ausentes ou inválidas não
 * escondem ações: sem uma expiração válida, a recomendação continua ativa.
 */
export function estaRecomendacaoExpirada(expiraEm, agora = new Date()) {
  const expiracao = timestampFromDateValue(expiraEm);
  const instanteAtual = timestampFromDateValue(agora);
  return Number.isFinite(expiracao) && Number.isFinite(instanteAtual) && expiracao <= instanteAtual;
}
