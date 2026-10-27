import test from 'node:test';
import assert from 'node:assert/strict';
import { cartoesResumo, selecionarDescobertas } from '../src/utils/selecionarDescobertas.js';

test('o resumo apresenta somente descobertas com evidências do período consultado', () => {
  const dados = { periodo: '2026-10', descobertas: [
    { id: 'atual', periodo: '2026-10', evidencias: ['registros'], tipo: 'REGISTRADO', titulo: 'Registros', informacao: 'Comparação disponível' },
    { id: 'antiga', periodo: '2026-09', evidencias: ['registros'] },
    { id: 'sem-base', periodo: '2026-10', evidencias: [] },
  ] };
  assert.deepEqual(cartoesResumo(dados).map(c => c.codigo), ['atual']);
});
test('o carrossel limita a três tópicos distintos sem modificar as fontes', () => {
  const card = codigo => ({ codigo, titulo: codigo, mensagem: 'Observação', acao: 'descobertas' });
  const cards = [card('a'), card('a'), card('b'), card('c'), card('d')];
  assert.deepEqual(selecionarDescobertas(cards).map(c => c.codigo), ['a', 'b', 'c']);
  assert.equal(cards.length, 5);
});
