const valid = value => typeof value === 'string' && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value);
export function deslocarMes(periodo, offset) {
  if (!valid(periodo) || !Number.isInteger(offset)) return null;
  const [year, month] = periodo.split('-').map(Number);
  const index = year * 12 + month - 1 + offset;
  const result = String(Math.floor(index / 12)).padStart(4, '0') + '-' + String((index % 12) + 1).padStart(2, '0');
  return valid(result) ? result : null;
}
export function apresentarMesHome(periodo) {
  if (!valid(periodo)) return 'Período indisponível';
  const date = new Date(periodo + '-01T00:00:00Z');
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
function periodoAtualSaoPaulo(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(date);
  return `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}`;
}
export function navegacaoMensalHome(periodo, limites, loading, error, atual = periodoAtualSaoPaulo()) {
  const disabled = { anterior: null, proximo: null };
  if (loading || error || !valid(periodo) || !valid(limites?.periodoMinimo) || !valid(limites?.periodoMaximo) || limites.periodoMinimo > limites.periodoMaximo) return disabled;
  const max = limites.periodoMaximo < atual ? limites.periodoMaximo : atual;
  const previous = deslocarMes(periodo, -1), next = deslocarMes(periodo, 1);
  return { anterior: previous && previous >= limites.periodoMinimo && previous <= max ? previous : null,
    proximo: next && next >= limites.periodoMinimo && next <= max ? next : null };
}
