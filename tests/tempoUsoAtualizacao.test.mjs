import assert from 'node:assert/strict';
import test from 'node:test';
import {
  emitirAtualizacaoTempoUso,
  observarAtualizacaoTempoUso,
} from '../src/utils/tempoUsoAtualizacao.js';

test('observadores recebem atualizações e cleanup remove somente o próprio listener', () => {
  const chamadas = [];
  const removerA = observarAtualizacaoTempoUso(() => chamadas.push('A'));
  const removerB = observarAtualizacaoTempoUso(() => chamadas.push('B'));

  emitirAtualizacaoTempoUso();
  removerA();
  removerA();
  emitirAtualizacaoTempoUso();
  removerB();

  assert.deepEqual(chamadas, ['A', 'B', 'B']);
});

test('listener inválido não é registrado e erro de um listener não interrompe os demais', () => {
  const chamadas = [];
  const removerInvalido = observarAtualizacaoTempoUso(null);
  const removerErro = observarAtualizacaoTempoUso(() => { throw new Error('listener'); });
  const removerValido = observarAtualizacaoTempoUso(() => chamadas.push('ok'));

  assert.doesNotThrow(() => emitirAtualizacaoTempoUso());
  removerInvalido();
  removerErro();
  removerValido();
  assert.deepEqual(chamadas, ['ok']);
});
