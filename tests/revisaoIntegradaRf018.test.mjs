import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer } from './helpers/componentRenderer.mjs';
const native = Object.fromEntries(
  ['View', 'Text', 'Pressable', 'ActivityIndicator', 'TouchableOpacity'].map(
    (k) => [k, k],
  ),
);
native.StyleSheet = { create: (v) => v };
const text = (n) =>
  n == null || typeof n === 'boolean'
    ? ''
    : typeof n === 'object'
      ? (n.props?.children ?? []).map(text).join('')
      : String(n);
const row = (revisao, planejamento) => ({
  versaoContrato: 1,
  compraId: 1,
  revisao,
  criadaEm: '2026-10-25T09:00:00Z',
  respostas: { planejamento },
  itens: [{ itemId: 10, planejamento }],
  eventosPosteriores: [],
});
function history({ fail = false, malformed = false } = {}) {
  const c = new AbortController();
  const calls = [];
  const r = createRenderer({
    'react-native': native,
    '../../api/client': {
      apiClient: {
        get: async (url, config) => {
          calls.push({ url, config });
          if (fail) throw Error('NETWORK');
          return {
            data: {
              versaoContrato: 1,
              compraId: malformed ? 99 : 1,
              revisoes: config.params.antes ? [row(1, 'NAO')] : [row(2, 'SIM')],
              proximaAntes: config.params.antes ? null : 2,
            },
          };
        },
      },
    },
    '../../api/tokenStorage': {
      tokenStorage: {
        captureSession: async () => ({ id: 4, signal: c.signal }),
        assertSession() {
          if (c.signal.aborted) throw Error('SESSION');
        },
      },
    },
  });
  r.mount(
    r.load('src/components/PurchaseComponents/HistoricoContexto.js').default,
    { compraId: 1, revisao: 2 },
  );
  return { r, c, calls };
}
test('history presents current and older answers separately, paginates and clears on logout', async () => {
  const { r, c, calls } = history();
  await r.flush();
  assert.ok(
    r.nodes((n) => n.type === 'Text' && text(n) === 'Revisão 2 · atual').length,
  );
  r.nodes(
    (n) => n.type === 'Pressable' && text(n) === 'Ver revisões anteriores',
  )[0].props.onPress();
  await r.flush();
  assert.ok(
    r.nodes((n) => n.type === 'Text' && text(n) === 'Revisão 1 · histórica')
      .length,
  );
  assert.ok(
    r.nodes(
      (n) => n.type === 'Text' && text(n) === 'Planejamento da compra: Não',
    ).length,
  );
  assert.equal(calls[1].config.params.antes, 2);
  assert.equal(calls[0].config.rf017SessionId, 4);
  c.abort();
  await r.flush();
  assert.equal(
    r.nodes((n) => n.type === 'Text' && text(n).startsWith('Revisão ')).length,
    0,
  );
  r.unmount();
});
for (const opts of [{ fail: true }, { malformed: true }])
  test(
    'history fails closed without inventing revisions ' + JSON.stringify(opts),
    async () => {
      const { r } = history(opts);
      await r.flush();
      assert.ok(r.nodes((n) => n.props.accessibilityRole === 'alert').length);
      assert.equal(
        r.nodes((n) => n.type === 'Text' && text(n).startsWith('Revisão '))
          .length,
        0,
      );
      r.unmount();
    },
  );
test('classification badge clearly identifies a voluntary label and updates in both directions', async () => {
  const r = createRenderer({ 'react-native': native });
  const C = r.load(
    'src/components/PurchaseComponents/PurchaseItem/index.js',
  ).default;
  const purchase = {
    compra_id: 1,
    compra_status: 'CONFIRMADA',
    compra_classificacao: 'IMPULSIVA',
    compra_horario: '2026-10-15T12:00:00Z',
    compra_valor: 100,
    tb_compra_item: [],
  };
  r.mount(C, { purchase });
  await r.flush();
  assert.ok(
    r.nodes(
      (n) => n.type === 'Text' && text(n) === 'Sua classificação: Impulsiva',
    ).length,
  );
  r.update({
    purchase: { ...purchase, compra_classificacao: 'NAO_IMPULSIVA' },
  });
  await r.flush();
  assert.ok(
    r.nodes(
      (n) =>
        n.type === 'Text' && text(n) === 'Sua classificação: Não impulsiva',
    ).length,
  );
  r.update({ purchase });
  await r.flush();
  assert.ok(
    r.nodes(
      (n) => n.type === 'Text' && text(n) === 'Sua classificação: Impulsiva',
    ).length,
  );
  r.update({ purchase, resumo: { classificacao: 'NAO_IMPULSIVA' } });
  await r.flush();
  assert.ok(
    r.nodes(
      (n) =>
        n.type === 'Text' && text(n) === 'Sua classificação: Não impulsiva',
    ).length,
  );
  r.unmount();
});
test('purchase list has no clear-filter rendering while preserving the period filter', () => {
  const source = readFileSync(
    new URL('../src/pages/PurchasesScreen/index.js', import.meta.url),
    'utf8',
  );
  const itemSource = readFileSync(
    new URL('../src/components/PurchaseComponents/PurchaseItem/index.js', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /Limpar filtro/);
  assert.match(source, /comprasPeriodo\(eligiblePurchases,filtroConsumo\)/);
  assert.doesNotMatch(source, /mostrarOcultas|Compras ocultas|Voltar às compras visíveis/);
  assert.doesNotMatch(source, /oculto|itensOcultos/);
  assert.match(itemSource, /purchase\.tb_compra_item\.map/);
  assert.doesNotMatch(itemSource, /itensOcultos/);
});
