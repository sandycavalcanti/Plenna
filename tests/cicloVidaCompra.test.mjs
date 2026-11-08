import test from 'node:test';
import assert from 'node:assert/strict';
import { saldoQuantidade, saldoReembolso, valorQuantidadeCentavos, eventosAtuais } from '../src/utils/cicloVidaCompra.js';
import { moedaParaCentavos } from '../src/services/gestaoCompraService.js';

const item = { compra_item_id: 9, compra_item_quantidade: '3', compra_item_valor: '12.35' };
const event = (id, tipo, dados, extra = {}) => ({ id, tipo, itemId: 9, dados, anulado: false, corrigeEventoId: null, ...extra });
test('devoluções parciais acumulam sem presumir reembolso e sem reutilizar unidades', () => {
  const rows = [event(1, 'DEVOLUCAO', { quantidade: 1 }), event(2, 'DEVOLUCAO', { quantidade: 1 })];
  assert.equal(saldoQuantidade(item, rows, 'DEVOLUCAO'), 1);
  assert.equal(saldoQuantidade(item, [...rows, event(3, 'DEVOLUCAO', { quantidade: 1 })], 'DEVOLUCAO'), 0);
  assert.equal(saldoReembolso({ compra_valor: '37.05' }, item, rows), 3705);
});
test('devolução total, escopo inteiro e quantidade legada desconhecida', () => {
  assert.equal(saldoQuantidade(item, [event(1, 'DEVOLUCAO', {})], 'DEVOLUCAO'), 0);
  assert.equal(saldoQuantidade(item, [event(1, 'DEVOLUCAO', {}, { itemId: null })], 'DEVOLUCAO'), 0);
  assert.equal(saldoQuantidade({ ...item, compra_item_quantidade: null }, [], 'DEVOLUCAO'), null);
  assert.equal(saldoQuantidade(item, [event(1, 'CANCELAMENTO', {})], 'DEVOLUCAO'), 3);
});
test('correções e anulações conservam o ledger e recalculam o saldo', () => {
  const rows = [event(1, 'DEVOLUCAO', { quantidade: 2 }), event(2, 'DEVOLUCAO', { quantidade: 1 }, { corrigeEventoId: 1 })];
  assert.equal(saldoQuantidade(item, rows, 'DEVOLUCAO'), 2);
  assert.equal(saldoQuantidade(item, rows, 'DEVOLUCAO', 2), 3);
  assert.equal(saldoQuantidade(item, [...rows, event(3, 'DEVOLUCAO', {}, { corrigeEventoId: 2, anulado: true })], 'DEVOLUCAO'), 3);
  assert.equal(rows.length, 2);
  assert.equal(eventosAtuais(rows).length, 1);
});
test('saldo usa todos os eventos, incluindo devoluções anteriores aos últimos cinquenta', () => {
  const rows = [event(1, 'DEVOLUCAO', { quantidade: 1 }), ...Array.from({ length: 60 }, (_, i) => event(i + 2, 'CLASSIFICACAO', {}))];
  assert.equal(saldoQuantidade(item, rows, 'DEVOLUCAO'), 2);
});
test('valores usam centavos e milésimos, com arredondamento HALF_UP', () => {
  assert.equal(valorQuantidadeCentavos(item, 2), 2470);
  assert.equal(valorQuantidadeCentavos({ ...item, compra_item_valor: '0.01' }, 0.5), 1);
  assert.equal(valorQuantidadeCentavos({ ...item, compra_item_valor: null }, 1), null);
});
test('múltiplos reembolsos respeitam simultaneamente teto da compra e do item', () => {
  const rows = [event(1, 'REEMBOLSO', { valorCentavos: 1000 }), event(2, 'REEMBOLSO', { valorCentavos: 500 }, { itemId: null })];
  assert.equal(saldoReembolso({ compra_valor: '30.00' }, item, rows), 1500);
  assert.equal(saldoReembolso({ compra_valor: '50.00' }, item, rows), 2705);
  assert.equal(saldoReembolso({ compra_valor: null }, item, rows), null);
  assert.equal(saldoReembolso({ compra_valor: '15.00' }, null, rows), 0);
});
test('valores pt-BR colados, apagados, inválidos e limite seguro', () => {
  assert.equal(moedaParaCentavos('R$ 1.234.567,89'), 123456789);
  assert.equal(moedaParaCentavos('R$ 0,01'), 1);
  for (const value of ['', 'R$ ', 'R$ 0,00', '1.23,45', '-1,00', '9007199254740992']) assert.equal(moedaParaCentavos(value), null);
});
