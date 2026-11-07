import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/utils/historicoTempoUso.js', import.meta.url), 'utf8');
const { filtrarHistoricoUso, segundosHistoricoUso } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('mês selecionado consulta registros persistidos, sem depender de hoje', () => {
  const registros = [
    { tempo_uso_data_local: '2026-09-30T00:00:00Z', tempo_uso_duracao_segundos: 90 },
    { tempo_uso_data_local: '2026-10-01', tempo_uso_duracao_segundos: 116 },
  ];
  assert.equal(segundosHistoricoUso(filtrarHistoricoUso(registros, '2026-09')), 90);
  assert.equal(segundosHistoricoUso(filtrarHistoricoUso(registros, '2026-10')), 116);
  assert.equal(filtrarHistoricoUso(registros, '2026-08').length, 0);
});
test('legado sem dia local respeita Brasília na virada do mês', () => {
  const registros = [{ tempo_uso_data: '2026-10-01T01:00:00Z', tempo_uso_minutos: 2 }];
  assert.equal(segundosHistoricoUso(filtrarHistoricoUso(registros, '2026-09')), 120);
  assert.equal(filtrarHistoricoUso(registros, '2026-10').length, 0);
});
test('consulta Home independe de consentimento e permissão para coletar', async () => {
  const hook = (await readFile(new URL('../src/hooks/useTempoUsoHome.js', import.meta.url), 'utf8'))
    .replace(/^import .*;\r?\n/gm, '').replace('export function', 'function');
  let state;
  const calls = [];
  const registros = [{ tempo_uso_data_local: '2026-10-23', tempo_uso_duracao_segundos: 116 }];
  const result = new Function('useCallback', 'useRef', 'useState', 'useFocusEffect', 'apiClient', 'tokenStorage',
    hook + '; return useTempoUsoHome(true);')(
    fn => fn, () => ({ current: 0 }), initial => [initial, next => { state = next; }], () => {},
    { get: async path => { calls.push(path); return { data: registros }; } },
    { captureSession: async () => ({ id: 1, signal: new AbortController().signal }), assertSession() {} });
  await result.refresh();
  assert.deepEqual(calls, ['/tempo-uso']);
  assert.equal(state.estado, 'DISPONIVEL');
  assert.deepEqual(state.registros, registros);
});
