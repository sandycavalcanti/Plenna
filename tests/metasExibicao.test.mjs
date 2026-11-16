import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const exibicao = await import(`data:text/javascript;base64,${Buffer.from(await read('src/utils/metasExibicao.js')).toString('base64')}`);

test('Perfil exibe metas não concluídas independentemente do vencimento ou período', () => {
  const metas = exibicao.filtrarMetasNaoConcluidas([
    { meta_id: 1, meta_completado: false, meta_data: '2025-01-01' },
    { meta_id: 2, meta_completado: false, meta_data: '2099-01-01' },
    { meta_id: 3, meta_completado: true, meta_data: '2025-01-01' },
  ]);
  assert.deepEqual(metas.map((meta) => meta.meta_id), [1, 2]);
});

test('Perfil reconhece os formatos normalizado e bruto de conclusão', () => {
  assert.equal(exibicao.metaEstaConcluida({ meta_completado: true }), true);
  assert.equal(exibicao.metaEstaConcluida({ concluida: true }), true);
  assert.equal(exibicao.metaEstaConcluida({ meta_completado: false, meta_data: '2020-01-01' }), false);
});

test('Home mantém a consulta histórica por período e não filtra conclusão no componente', async () => {
  const hook = await read('src/hooks/useMetasHome.js');
  const home = await read('src/components/HomeComponents/MetasHome.js');
  assert.match(hook, /apiClient\.get\('\/metas\/historico'/);
  assert.match(hook, /params: \{ periodo \}/);
  assert.doesNotMatch(home, /filter\([^)]*conclu/);
});
