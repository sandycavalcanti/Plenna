import test from 'node:test';
import assert from 'node:assert/strict';
import {
  criarGravadorEvento,
  confirmarOperacoesRecuperadas,
  moedaParaCentavos,
  dataEfetiva,
  mensagemGestao,
} from '../src/services/gestaoCompraService.js';

import { createRenderer } from './helpers/componentRenderer.mjs';
const text = (n) =>
  n == null || typeof n === 'boolean'
    ? ''
    : typeof n === 'object'
      ? (n.props?.children ?? []).map(text).join('')
      : String(n);
function session() {
  const c = new AbortController();
  const s = { id: 1, signal: c.signal };
  return {
    s,
    c,
    storage: {
      captureSession: async () => s,
      assertSession() {
        if (c.signal.aborted) throw Error('SESSION');
      },
    },
  };
}
const body = {
  versaoContrato: 1,
  revisaoEsperada: 0,
  tipo: 'REEMBOLSO',
  valorCentavos: 1000,
  dataEfetiva: null,
};
const ack = (b) => ({
  data: {
    versaoContrato: 1,
    compraId: 1,
    persistido: true,
    evento: {
      id: 8,
      operacaoId: b.operacaoId,
      revisao: b.revisaoEsperada + 1,
      tipo: b.tipo,
      itemId: b.itemId ?? null,
      dataEfetiva: b.dataEfetiva,
      corrigeEventoId: b.corrigeEventoId ?? null,
      anulado: b.anulado ?? false,
      dados: b,
    },
  },
});
test('lost acknowledgement survives reopening and revision refresh without duplicate operation', async () => {
  const { storage } = session(),
    writes = [];
  let fail = true;
  const options = {
    storage,
    compraId: 1,
    uuid: () => String(writes.length),
    client: {
      post: async (u, b) => {
        writes.push(b);
        if (fail) {
          fail = false;
          throw Error('Network Error');
        }
        return ack(b);
      },
    },
  };
  await assert.rejects(criarGravadorEvento(options)(body));
  const result = await criarGravadorEvento(options)({
    ...body,
    revisaoEsperada: 1,
  });
  assert.equal(result.persistido, true);
  assert.equal(writes[0].operacaoId, writes[1].operacaoId);
  assert.equal(writes[1].revisaoEsperada, 0);
});
test('unexpected API acknowledgement is not success and retry preserves identity', async () => {
  const { storage } = session(),
    writes = [];
  let valid = false;
  const save = criarGravadorEvento({
    storage,
    compraId: 1,
    uuid: () => String(writes.length),
    client: {
      post: async (u, b) => {
        writes.push(b);
        return valid ? ack(b) : { data: { persistido: true } };
      },
    },
  });
  await assert.rejects(save(body), /não confirmou/);
  valid = true;
  await save(body);
  assert.equal(writes[0].operacaoId, writes[1].operacaoId);
});
test('history recovery recognizes confirmed operation and clears uncertain intent', async () => {
  const { storage, s } = session();
  const save = criarGravadorEvento({
    storage,
    compraId: 1,
    uuid: () => 'same',
    client: {
      post: async () => {
        throw Error('Network Error');
      },
    },
  });
  await assert.rejects(save(body));
  assert.equal(
    confirmarOperacoesRecuperadas(s, 2, [{ operacaoId: 'same' }]),
    0,
  );
  assert.equal(
    confirmarOperacoesRecuperadas(s, 1, [{ operacaoId: 'same' }]),
    1,
  );
  assert.equal(
    confirmarOperacoesRecuperadas(s, 1, [{ operacaoId: 'same' }]),
    0,
  );
});
test('session revocation after response never confirms to another user', async () => {
  const { storage, c } = session();
  const save = criarGravadorEvento({
    storage,
    compraId: 1,
    uuid: () => 'one',
    client: {
      post: async (u, b) => {
        c.abort();
        return ack(b);
      },
    },
  });
  await assert.rejects(save(body), /SESSION/);
});
test('known revision conflict permits a fresh operation after reload', async () => {
  const { storage } = session(),
    writes = [];
  const save = criarGravadorEvento({
    storage,
    compraId: 1,
    uuid: () => String(writes.length),
    client: {
      post: async (u, b) => {
        writes.push(b);
        if (writes.length === 1) throw { response: { status: 409 } };
        return ack(b);
      },
    },
  });
  await assert.rejects(save(body));
  await save({ ...body, revisaoEsperada: 3 });
  assert.notEqual(writes[0].operacaoId, writes[1].operacaoId);
  assert.equal(writes[1].revisaoEsperada, 3);
});
test('money and civil dates reject ambiguous or invented values', () => {
  assert.equal(moedaParaCentavos('12,35'), 1235);
  for (const x of ['1.234,56', '-1', 'NaN', '0', '12.345'])
    assert.equal(moedaParaCentavos(x), null);
  assert.equal(dataEfetiva(''), null);
  assert.equal(dataEfetiva('23/10/2026'), '2026-10-23');
  assert.throws(() => dataEfetiva('31/02/2026'));
});
test('errors distinguish authentication, validation, unavailable structures and network', () => {
  assert.match(
    mensagemGestao({ response: { status: 401 } }),
    /Entre novamente/,
  );
  assert.match(
    mensagemGestao({
      response: { status: 422, data: { message: 'Confira a quantidade.' } },
    }),
    /quantidade/,
  );
  assert.match(mensagemGestao({ response: { status: 503 } }), /ambiente/);
  assert.match(
    mensagemGestao(Error('Network Error')),
    /escolhas foram mantidas/,
  );
});

const native = Object.fromEntries(
  [
    'Modal',
    'View',
    'Text',
    'Pressable',
    'ScrollView',
    'TextInput',
    'ActivityIndicator',
  ].map((k) => [k, k]),
);
native.StyleSheet = { create: (v) => v };
function sheet({ action, item, fail = false } = {}) {
  const { storage } = session();
  let writes = [],
    rev = 0;
  const r = createRenderer({
    'react-native': native,
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'expo-crypto': { randomUUID: () => 'op' },
    '../../api/tokenStorage': { tokenStorage: storage },
    '../../api/client': {
      apiClient: {
        get: async () => ({
          data: {
            versaoContrato: 1,
            compraId: 1,
            disponivel: true,
            revisao: rev,
            eventos: [],
          },
        }),
        post: async (u, b) => {
          writes.push(b);
          if (fail) throw Error('Network Error');
          rev++;
          return ack(b);
        },
      },
    },
  });
  r.mount(
    r.load('src/components/PurchaseComponents/GerenciarCompra.js').default,
    {
      compra: { compra_id: 1, compra_status: 'CONFIRMADA' },
      item,
      acaoInicial: action,
      onClose() {},
      onSaved() {},
    },
  );
  return {
    r,
    writes,
    press(label) {
      const n = r.nodes((n) => n.props.onPress && text(n) === label)[0];
      assert.ok(n, label);
      n.props.onPress();
    },
  };
}
for (const [label, reason] of [
  ['Registro duplicado', 'DUPLICADO'],
  ['Registro incorreto', 'INCORRETO'],
  ['Compra ou item não realizado', 'NAO_REALIZADA'],
  ['Outro motivo', 'OUTRO'],
])
  test('deletion requires explicit reason: ' + reason, async () => {
    const s = sheet({ action: 'EXCLUSAO_REGISTRO' });
    await s.r.flush();
    s.press('Confirmar exclusão do registro');
    await s.r.flush();
    assert.equal(s.writes.length, 0);
    s.press(label);
    await s.r.flush();
    s.press('Confirmar exclusão do registro');
    await s.r.flush();
    assert.equal(s.writes[0].motivo, reason);
    assert.equal(s.writes[0].dataEfetiva, null);
    s.r.unmount();
  });
test('partial item return remains scoped and does not invent a refund', async () => {
  const s = sheet({ action: 'DEVOLUCAO', item: { compra_item_id: 9 } });
  await s.r.flush();
  s.r
    .nodes((n) => n.props.accessibilityLabel === 'Quantidade do evento')[0]
    .props.onChangeText('0,5');
  await s.r.flush();
  s.press('Confirmar registro');
  await s.r.flush();
  assert.equal(s.writes[0].quantidade, 0.5);
  assert.equal(s.writes[0].itemId, 9);
  assert.equal(s.writes[0].valorCentavos, undefined);
  s.r.unmount();
});
test('failed refund preserves entered amount and form', async () => {
  const s = sheet({ action: 'REEMBOLSO', fail: true });
  await s.r.flush();
  s.r
    .nodes((n) => n.props.accessibilityLabel === 'Valor reembolsado')[0]
    .props.onChangeText('35,50');
  await s.r.flush();
  s.press('Confirmar registro');
  await s.r.flush();
  assert.equal(
    s.r.nodes((n) => n.props.accessibilityLabel === 'Valor reembolsado')[0]
      .props.value,
    '35,50',
  );
  assert.equal(s.writes[0].valorCentavos, 3550);
  assert.ok(s.r.nodes((n) => n.props.accessibilityRole === 'alert').length);
  s.r.unmount();
});
for (const [label, value] of [
  ['Impulsiva', 'IMPULSIVA'],
  ['Não impulsiva', 'NAO_IMPULSIVA'],
  ['Prefiro não classificar', 'PREFIRO_NAO_CLASSIFICAR'],
])
  test('voluntary classification ' + value, async () => {
    const s = sheet({ action: 'CLASSIFICACAO' });
    await s.r.flush();
    s.press(label);
    await s.r.flush();
    s.press('Confirmar registro');
    await s.r.flush();
    assert.equal(s.writes[0].classificacao, value);
    assert.equal(s.writes[0].tipo, 'CLASSIFICACAO');
    s.r.unmount();
  });
test('historical comparison never falls back to current reference', () => {
  const r = createRenderer({
    'react-native': native,
    '../../api/client': { apiClient: {} },
    '../../api/tokenStorage': { tokenStorage: {} },
  });
  const { apresentarComparacao } = r.load(
    'src/components/PurchaseComponents/ComparacaoFinanceira.js',
  );
  const data = {
    compraCentavos: 80000,
    limiteAtualCentavos: 90000,
    limiteHistoricoCentavos: 65000,
  };
  assert.equal(apresentarComparacao(data).diferenca, -10000);
  assert.equal(apresentarComparacao(data, true).diferenca, 15000);
  assert.equal(
    apresentarComparacao({ ...data, limiteHistoricoCentavos: null }, true),
    null,
  );
});

test('reflections require informed evidence and do not turn refusals into a conclusion', async () => {
  const { reflexaoContextual } = await import(
    '../src/components/PurchaseComponents/reflexoesVisuais.js'
  );
  assert.equal(reflexaoContextual(null), null);
  assert.equal(
    reflexaoContextual({
      respostas: { planejamento: 'PREFIRO_NAO_RESPONDER' },
      itens: [{ planejamento: 'PREFIRO_NAO_RESPONDER' }],
    }),
    null,
  );
  const r = reflexaoContextual({
    respostas: { planejamento: 'PARCIALMENTE' },
    itens: [{ planejamento: 'NAO' }],
  });
  assert.equal(r.base.length, 2);
  assert.match(r.pergunta, /itens/);
  assert.equal('classificacao' in r, false);
});
test('summary batches keep session and reject foreign or duplicated purchase identities', async () => {
  const { storage, c } = session();
  let mode = 'valid';
  const calls = [];
  const r = createRenderer({
    '../api/tokenStorage': { tokenStorage: storage },
    '../api/client': {
      apiClient: {
        get: async (url, config) => {
          calls.push(config);
          const ids = config.params.ids.split(',').map(Number);
          return {
            data: {
              versaoContrato: 1,
              resumos:
                mode === 'missing'
                  ? []
                  : mode === 'foreign'
                  ? [{ compraId: 999, classificacao: 'PENDENTE' }]
                  : mode === 'duplicate'
                    ? [
                        { compraId: ids[0], classificacao: 'PENDENTE' },
                        { compraId: ids[0], classificacao: 'PENDENTE' },
                      ]
                    : ids.map((compraId) => ({
                        compraId,
                        classificacao: compraId === 1 ? 'IMPULSIVA' : 'PENDENTE',
                      })),
            },
          };
        },
      },
    },
  });
  const { consultarResumosCompras } = r.load('src/services/resumosCompras.js');
  const result = await consultarResumosCompras(
    Array.from({ length: 101 }, (_, i) => ({ compra_id: i + 1 })),
  );
  assert.equal(calls.length, 2);
  assert.equal(result[1].classificacao, 'IMPULSIVA');
  assert.equal(calls[0].rf017SessionId, 1);
  mode = 'foreign';
  await assert.rejects(consultarResumosCompras([{ compra_id: 1 }]));
  mode = 'duplicate';
  await assert.rejects(consultarResumosCompras([{ compra_id: 1 }]));
  mode = 'missing';
  await assert.rejects(consultarResumosCompras([{ compra_id: 1 }]));
  c.abort();
  await assert.rejects(consultarResumosCompras([{ compra_id: 1 }]));
});
