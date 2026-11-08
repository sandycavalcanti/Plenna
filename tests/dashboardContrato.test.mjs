import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/api/dashboard.js', import.meta.url), 'utf8');
const period = month => ({ periodo: month, inicio: `${month}-01T03:00:00Z`,
  fim: new Date(Date.UTC(Number(month.slice(0,4)), Number(month.slice(5)), 1, 3)).toISOString(),
  total_centavos: 0, total: 0, desconto_centavos: 0, desconto: 0,
  quantidade_compras: 0, quantidade_compras_com_valor: 0, categorias: [], formas_pagamento: [],
  compras_acima_limite: { acima_limite: 0, dentro_limite: 0 }, impulsividade: [] });
const response = params => ({ mode: params.mode, timezone: 'America/Sao_Paulo',
  periodos: (params.mode === 'compare' ? [params.monthA, params.monthB] : [params.month]).map(period),
  comparacao: params.mode === 'compare' ? { periodo_base: params.monthA, periodo_comparado: params.monthB,
    total: { base: 0, comparado: 0, diferenca: 0, variacao_percentual: null },
    quantidade_compras: { base: 0, comparado: 0, diferenca: 0, variacao_percentual: null }, categorias: [] } : null });
function harness() {
  let valid = true;
  const controller = new AbortController();
  const calls = [];
  const storage = {
    captureSession: async () => valid ? { id: 4, signal: controller.signal } : null,
    assertSession: id => { if (!valid || id !== 4) throw Error('SESSION_CHANGED'); },
  };
  const client = { get: async (...args) => { calls.push(args); return { data: response(args[1].params) }; } };
  const code = source.replace(/^import .*;\r?\n/gm, '').replace('export async function', 'async function');
  const request = new Function('apiClient', 'tokenStorage', `${code}; return getDashboardAnalytics;`)(client, storage);
  return { request, calls, client, revoke() { valid = false; controller.abort(); } };
}

test('analytics binds the selected period and request to the authenticated session', async () => {
  const h = harness();
  const params = { mode: 'compare', monthA: '2026-09', monthB: '2026-10' };
  await h.request(params);
  assert.equal(h.calls[0][0], '/dashboard/analytics');
  assert.deepEqual(h.calls[0][1].params, params);
  assert.equal(h.calls[0][1].usageMonitoringSessionId, 4);
  assert.ok(h.calls[0][1].signal);
});

test('analytics rejects a late response after logout instead of exposing another session data', async () => {
  const h = harness();
  let resolve;
  h.client.get = () => new Promise(done => { resolve = done; });
  const pending = h.request({ mode: 'month', month: '2026-10' });
  await new Promise(done => setImmediate(done));
  h.revoke();
  resolve({ data: { periodos: [{ total: 100 }] } });
  await assert.rejects(pending, /SESSION_CHANGED/);
});

test('analytics without a session never dispatches HTTP', async () => {
  const h = harness();
  h.revoke();
  await assert.rejects(h.request({ mode: 'month', month: '2026-10' }), /SESSION_REQUIRED/);
  assert.equal(h.calls.length, 0);
});

test('F30: malformed data, foreign month and missing indicators are errors, never empty success', async () => {
  const params = { mode: 'month', month: '2026-10' };
  for (const mutate of [
    () => null,
    data => ({...data, periodos: []}),
    data => ({...data, timezone: 'UTC'}),
    data => ({...data, periodos: [period('2026-09')]}),
    data => ({...data, periodos: [{...data.periodos[0], categorias: null}]}),
    data => ({...data, periodos: [{...data.periodos[0], total_centavos: NaN}]}),
  ]) {
    const h = harness();h.client.get = async () => ({data: mutate(response(params))});
    await assert.rejects(h.request(params), {code:'INVALID_DASHBOARD_CONTRACT'});
  }
  assert.equal((await harness().request(params)).periodos[0].quantidade_compras, 0);
});

test('F30: evolution validates all requested months across a year boundary', async () => {
  const h = harness(), params = {mode:'evolution', months:6, end:'2026-02'};
  const data = {mode:'evolution', timezone:'America/Sao_Paulo', comparacao:null,
    periodos:['2025-09','2025-10','2025-11','2025-12','2026-01','2026-02'].map(period)};
  h.client.get = async () => ({data});assert.equal((await h.request(params)).periodos.length, 6);
  data.periodos.reverse();await assert.rejects(h.request(params), {code:'INVALID_DASHBOARD_CONTRACT'});
});
