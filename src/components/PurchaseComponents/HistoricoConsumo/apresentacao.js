const months = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
// Periods use registered civil days: never shift those dates by the device timezone.
export function diaCivil(iso) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d === 1 ? '1º' : d} de ${months[m - 1]} de ${y}`;
}
export function periodoCivil(inicio, fimExclusivo) {
  if (Date.parse(fimExclusivo) <= Date.parse(inicio))
    return 'Sem dias observados neste período';
  const end = new Date(Date.parse(fimExclusivo) - 1).toISOString(),
    a = inicio.slice(0, 10),
    b = end.slice(0, 10);
  if (a === b) return diaCivil(a);
  if (a.slice(0, 7) === b.slice(0, 7))
    return `${Number(a.slice(8)) === 1 ? '1º' : Number(a.slice(8))} a ${diaCivil(b)}`;
  return `${diaCivil(a)} a ${diaCivil(b)}`;
}
export function nomeMes(periodo) {
  const [y, m] = periodo.split('-');
  return `${months[Number(m) - 1]} de ${y}`;
}
export function coberturaRespostas(a, b) {
  const total = a.universo + b.universo,
    known = a.conhecidas + b.conhecidas;
  return `${known} de ${total} (${total ? Math.round((100 * known) / total) : 0}%)`;
}
