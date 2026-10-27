import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/utils/destaquesHome.js', import.meta.url), 'utf8');
const { unificarDestaquesHome } = await import(
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64'),
);

test('Home does not mix persisted recommendations with system discoveries', () => {
  const recommendations = [
    { id: 10, tipo: 'ORCAMENTO_EXCEDIDO', titulo: 'Orcamento', texto: 'Veja o mes.' },
  ];
  const discoveries = [
    { codigo: 'RF018_ORCAMENTO', titulo: 'Outro aviso de orcamento', mensagem: 'Mesmo contexto', acao: 'descobertas' },
    { codigo: 'RF018_FREQUENCIA', titulo: 'Frequencia', mensagem: 'Registros frequentes', acao: 'descobertas' },
  ];
  const result = unificarDestaquesHome(recommendations, [], true, discoveries);
  assert.deepEqual(result.map((item) => item.tipoItem), ['RECOMENDACAO']);
  assert.equal(result[0].id, 10);
});

test('Home keeps system discoveries in the single fallback stream', () => {
  const discoveries = [
    { codigo: 'RF018_ORCAMENTO', titulo: 'Orcamento', mensagem: 'Veja o mes.', acao: 'descobertas' },
    { codigo: 'RF018_FREQUENCIA', titulo: 'Frequencia', mensagem: 'Registros frequentes', acao: 'descobertas' },
  ];
  const result = unificarDestaquesHome([], [], true, discoveries);
  assert.deepEqual(result.map((item) => item.tipoItem), ['DESTAQUE_SISTEMA', 'DESTAQUE_SISTEMA']);
});

test('Home does not keep a parallel RF018 carousel', async () => {
  const home = await readFile(new URL('../src/pages/HomeScreen/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(home, /DescobertasCarousel/);
  assert.match(home, /cartoesResumo\(descobertas\.dados\)/);
});
