import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const contractSource = await read('src/utils/metaContract.js');
const { normalizarRespostaHistoricoMetas } = await import(`data:text/javascript;base64,${Buffer.from(contractSource).toString('base64')}`);

const historicalResponse = (overrides = {}) => ({
  versaoContrato: 2,
  periodo: '2026-10',
  referenciaTemporal: 'America/Sao_Paulo',
  limitacoes: [],
  metas: [
    {
      meta_id: 1,
      meta_titulo: 'Cadeira Gamer',
      meta_descricao: null,
      meta_valor: '500.00',
      meta_valor_reservado: '400.00',
      progresso_percentual: 80,
      meta_completado: false,
      meta_data_criacao: '2026-08-01T12:00:00.000Z',
      meta_data_conclusao: null,
      saldo_historico_disponivel: true,
      historico_completo: true,
      historico_limitacoes: [],
    },
    {
      meta_id: 2,
      meta_titulo: 'Jaqueta',
      meta_descricao: null,
      meta_valor: '400.00',
      meta_valor_reservado: '250.00',
      progresso_percentual: 62.5,
      meta_completado: true,
      meta_data_criacao: '2026-08-01T12:00:00.000Z',
      meta_data_conclusao: '2026-10-15T12:00:00.000Z',
      saldo_historico_disponivel: true,
      historico_completo: true,
      historico_limitacoes: [],
    },
  ],
  ...overrides,
});

test('simplified historical contract preserves balance, progress and completion', () => {
  const data = historicalResponse({ metas: [
    ...historicalResponse().metas,
    { ...historicalResponse().metas[0], meta_id: 3, meta_titulo: 'Legada' },
  ] });
  const normalized = normalizarRespostaHistoricoMetas(data, '2026-10');
  assert.equal(normalized.metas[0].meta_valor_reservado, '400.00');
  assert.equal(normalized.metas[1].meta_completado, true);
  assert.equal(normalized.metas[1].meta_data_conclusao, '2026-10-15T12:00:00.000Z');
  assert.equal(normalized.metas[2].meta_valor, '500.00');
  assert.equal(Object.hasOwn(normalized.metas[2], 'objetivo_historico_disponivel'), false);
});

test('historical contract rejects divergent period and missing financial fields', () => {
  assert.throws(() => normalizarRespostaHistoricoMetas(historicalResponse(), '2026-09'), /INVALID_METAS/);
  const invalidBalance = historicalResponse({ metas: [{ ...historicalResponse().metas[0], meta_valor_reservado: null }] });
  assert.throws(() => normalizarRespostaHistoricoMetas(invalidBalance, '2026-10'), /INVALID_METAS/);
  const invalidTarget = historicalResponse({ metas: [{ ...historicalResponse().metas[0], meta_valor: null }] });
  assert.throws(() => normalizarRespostaHistoricoMetas(invalidTarget, '2026-10'), /INVALID_METAS/);
});

test('Home queries goals by selected period and maps the simplified historical contract', async () => {
  const home = await read('src/pages/HomeScreen/index.js');
  const hook = await read('src/hooks/useMetasHome.js');
  assert.match(home, /useMetasHome\(periodo\)/);
  assert.match(hook, /apiClient\.get\('\/metas\/historico'/);
  assert.match(hook, /params: \{ periodo \}/);
  assert.match(hook, /\}, \[periodo\]\)/);

  const source = `${contractSource.replace(/^export /gm, '')}\n${hook.replace(/^import .*;\r?\n/gm, '').replace('export function', 'function')}`;
  let state;
  const calls = [];
  const hookInstance = new Function(
    'useCallback', 'useRef', 'useState', 'useFocusEffect', 'apiClient', 'tokenStorage',
    `${source}; return useMetasHome;`,
  )(
    (callback) => callback,
    (initial) => ({ current: initial }),
    (initial) => [initial, (next) => { state = typeof next === 'function' ? next(state) : next; }],
    () => {},
    { get: async (path, options) => { calls.push({ path, options }); return { data: historicalResponse() }; } },
    { captureSession: async () => ({ id: 7, signal: new AbortController().signal }), assertSession: () => {} },
  );

  const useMetas = hookInstance('2026-10');
  await useMetas.refresh();
  assert.equal(calls[0].path, '/metas/historico');
  assert.equal(calls[0].options.params.periodo, '2026-10');
  assert.equal(state.metas[0].valorReservado, '400.00');
  assert.equal(state.metas[1].concluida, true);
});
