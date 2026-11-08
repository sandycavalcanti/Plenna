// Projeção de leitura do contrato v1. Não altera valores nem eventos persistidos.
export function eventosAtuais(eventos, correctionId) {
  const substituidos = new Set(eventos.map(e => e.corrigeEventoId).filter(Boolean));
  return eventos.filter(e => !substituidos.has(e.id) && !e.anulado && e.id !== correctionId);
}

export function saldoQuantidade(item, eventos, tipo, correctionId) {
  if (item?.compra_item_quantidade == null) return null;
  const original = Number(item.compra_item_quantidade);
  if (!Number.isFinite(original) || original <= 0) return null;
  let utilizado = 0;
  for (const e of eventosAtuais(eventos, correctionId)) {
    if (e.tipo !== tipo) continue;
    if (e.itemId == null) return 0;
    if (e.itemId !== item.compra_item_id) continue;
    if (e.dados?.quantidade == null) return 0;
    utilizado += Math.round(Number(e.dados.quantidade) * 1000);
  }
  return Math.max(0, Math.round(original * 1000) - utilizado) / 1000;
}

export function centavosRegistrados(value) {
  if (value == null || !/^\d+(?:\.\d{1,2})?$/.test(String(value))) return null;
  const [whole, fraction = ''] = String(value).split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function valorQuantidadeCentavos(item, quantidade) {
  const cents = centavosRegistrados(item?.compra_item_valor);
  if (cents == null || !Number.isFinite(quantidade) || quantidade <= 0) return null;
  const milli = Math.round(quantidade * 1000);
  if (!Number.isSafeInteger(milli)) return null;
  const total = Number((BigInt(cents) * BigInt(milli) + 500n) / 1000n);
  return Number.isSafeInteger(total) ? total : null;
}

export function saldoReembolso(compra, item, eventos, correctionId) {
  const atuais = eventosAtuais(eventos, correctionId).filter(e => e.tipo === 'REEMBOLSO');
  const total = centavosRegistrados(compra.compra_valor);
  if (total == null) return null;
  const saldoCompra = total - atuais.reduce((n, e) => n + e.dados.valorCentavos, 0);
  if (!item) return Math.max(0, saldoCompra);
  const tetoItem = item.compra_item_quantidade == null ? null : valorQuantidadeCentavos(item, Number(item.compra_item_quantidade));
  if (tetoItem == null) return null;
  const pagoItem = atuais.filter(e => e.itemId === item.compra_item_id).reduce((n, e) => n + e.dados.valorCentavos, 0);
  return Math.max(0, Math.min(saldoCompra, tetoItem - pagoItem));
}
