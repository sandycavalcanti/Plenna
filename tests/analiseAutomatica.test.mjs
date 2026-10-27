import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validarAnaliseAutomatica,
  consultarAnaliseAutomatica,
} from '../src/services/analiseAutomaticaService.js';
import { createRenderer } from './helpers/componentRenderer.mjs';
const text = (n) =>
  n == null || typeof n === 'boolean'
    ? ''
    : typeof n === 'object'
      ? (n.props?.children ?? []).map(text).join('')
      : String(n);
const evidence = (extra = {}) => ({
  indicador: 'V01',
  familia: 'VALORES',
  regra: 'TUKEY',
  sinal: true,
  amostra: 6,
  observado: 45000,
  referencia: 7000,
  unidade: 'CENTAVOS',
  ...extra,
});
const response = (extra = {}) => ({
  versaoContrato: 1,
  versaoMotor: 'automatico-1',
  compraId: 1,
  escopo: 'COMPRA',
  estado: 'SINAIS_RELEVANTES',
  classificacaoAutomaticaDefinitiva: false,
  persistido: false,
  qualidadeDados: { registrosElegiveis: 6, criteriosIndisponiveis: [] },
  evidencias: [evidence()],
  descobertas: [
    {
      tipo: 'OBSERVACAO_AUTOMATICA',
      titulo: 'Valor diferente das referências disponíveis',
      mensagem: 'Isso não determina impulsividade.',
    },
  ],
  limitacoes: [],
  janela: {
    inicio: '2026-04-01T00:00:00Z',
    fimExclusivo: '2026-10-15T00:00:00Z',
  },
  dependencias: { fontesHash: 'a'.repeat(64) },
  ...extra,
});
function session() {
  const c = new AbortController();
  return {
    c,
    s: { id: 3, signal: c.signal },
    storage: {
      assertSession() {
        if (c.signal.aborted) throw Error('SESSION');
      },
    },
  };
}
test('automatic endpoint captures user session, identity and no write is performed', async () => {
  const { s, storage } = session(),
    calls = [];
  const result = await consultarAnaliseAutomatica({
    compraId: 1,
    session: s,
    storage,
    client: {
      get: async (...args) => {
        calls.push(args);
        return { data: response() };
      },
    },
  });
  assert.equal(result.persistido, false);
  assert.equal(calls[0][0], '/analises/compras/1/automatica');
  assert.equal(calls[0][1].rf017SessionId, 3);
  assert.equal(calls[0][1].signal, s.signal);
});
test('malformed versions, foreign purchase, fabricated diagnosis and conflicting states fail closed', () => {
  for (const d of [
    {},
    response({ versaoMotor: 'other' }),
    response({ compraId: 2 }),
    response({ classificacaoAutomaticaDefinitiva: true }),
    response({ estado: 'SEM_SINAIS_RELEVANTES' }),
    response({ estado: 'COMBINACAO_SINAIS_RELEVANTES' }),
    response({ dependencias: { fontesHash: 'invalid' } }),
  ])
    assert.throws(() => validarAnaliseAutomatica(d, 1));
});
test('unknown and absence of identified signals remain different valid states', () => {
  assert.equal(
    validarAnaliseAutomatica(
      response({
        estado: 'DADOS_INSUFICIENTES',
        evidencias: [],
        descobertas: [],
      }),
      1,
    ).estado,
    'DADOS_INSUFICIENTES',
  );
  assert.equal(
    validarAnaliseAutomatica(
      response({
        estado: 'SEM_SINAIS_RELEVANTES',
        evidencias: [evidence({ sinal: false })],
        descobertas: [],
      }),
      1,
    ).estado,
    'SEM_SINAIS_RELEVANTES',
  );
});
test('late response after session revocation is never displayed', async () => {
  const { c, s, storage } = session();
  await assert.rejects(
    consultarAnaliseAutomatica({
      compraId: 1,
      session: s,
      storage,
      client: {
        get: async () => {
          c.abort();
          return { data: response() };
        },
      },
    }),
    /SESSION/,
  );
});
test('network failure and unexpected API response never become absence of signs', async () => {
  for (const get of [
    async () => {
      throw Error('Network Error');
    },
    async () => ({ data: {} }),
  ]) {
    const { s, storage } = session();
    await assert.rejects(
      consultarAnaliseAutomatica({
        compraId: 1,
        session: s,
        storage,
        client: { get },
      }),
    );
  }
});
const native = Object.fromEntries(
  ['ActivityIndicator', 'Pressable', 'Text', 'View'].map((k) => [k, k]),
);
function screen(data, fail = false) {
  const { c, s, storage } = session();
  let version = data;
  const r = createRenderer({
    'react-native': native,
    '../../api/client': {
      apiClient: {
        get: async () => {
          if (fail) throw Error('Network Error');
          return { data: version };
        },
      },
    },
    '../../api/tokenStorage': {
      tokenStorage: { ...storage, captureSession: async () => s },
    },
    '../ReadingDetails': {
      __esModule: true,
      default: ({ children }) => ({ type: 'View', props: { children } }),
    },
  });
  const props = { compraId: 1, revisao: 0, refreshKey: 0 };
  r.mount(
    r.load('src/components/PurchaseComponents/AnaliseAutomatica.js').default,
    props,
  );
  return {
    r,
    c,
    change(value) {
      version = value;
      r.update({ ...props, refreshKey: 1 });
    },
  };
}
for (const [estado, fragment] of [
  ['SINAIS_RELEVANTES', 'Valor diferente'],
  ['COMBINACAO_SINAIS_RELEVANTES', 'Valor diferente'],
  ['DADOS_INSUFICIENTES', 'Ainda faltam'],
  ['SEM_SINAIS_RELEVANTES', 'regras disponíveis'],
])
  test(
    'Mobile presents ' +
      estado +
      ' independently of the optional questionnaire',
    async () => {
      const evidencias =
        estado === 'DADOS_INSUFICIENTES'
          ? []
          : estado === 'SEM_SINAIS_RELEVANTES'
            ? [evidence({ sinal: false })]
            : estado === 'COMBINACAO_SINAIS_RELEVANTES'
              ? [
                  evidence(),
                  evidence({
                    indicador: 'F04',
                    familia: 'FREQUENCIA',
                    unidade: 'COMPRAS',
                    observado: 10,
                    referencia: 4,
                  }),
                ]
              : [evidence()];
      const s = screen(
        response({
          estado,
          evidencias,
          descobertas: [
            'DADOS_INSUFICIENTES',
            'SEM_SINAIS_RELEVANTES',
          ].includes(estado)
            ? []
            : response().descobertas,
        }),
      );
      await s.r.flush();
      assert.ok(
        s.r.nodes((n) => n.type === 'Text' && text(n).includes(fragment))
          .length,
      );
      assert.equal(
        s.r.nodes((n) => n.props.accessibilityRole === 'radio').length,
        0,
      );
      s.r.unmount();
    },
  );
test('Mobile clears previous assessment when session is revoked', async () => {
  const s = screen(response());
  await s.r.flush();
  assert.ok(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('Valor diferente'))
      .length,
  );
  s.c.abort();
  await s.r.flush();
  assert.equal(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('Valor diferente'))
      .length,
    0,
  );
  s.r.unmount();
});
test('new revision/refresh reprocesses without retaining a prior signal as current', async () => {
  const s = screen(response());
  await s.r.flush();
  s.change(
    response({
      estado: 'DADOS_INSUFICIENTES',
      evidencias: [],
      descobertas: [],
    }),
  );
  await s.r.flush();
  assert.equal(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('Valor diferente'))
      .length,
    0,
  );
  assert.ok(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('Ainda faltam'))
      .length,
  );
  s.r.unmount();
});
test('unavailable automatic service does not fabricate a clinical or normal result', async () => {
  const s = screen(null, true);
  await s.r.flush();
  assert.ok(
    s.r.nodes(
      (n) => n.type === 'Text' && text(n).includes('indisponível agora'),
    ).length,
  );
  assert.equal(
    s.r.nodes((n) => n.type === 'Text' && text(n).includes('não identificaram'))
      .length,
    0,
  );
  s.r.unmount();
});

test('manual refresh updates both historical and independent automatic sources', async () => {
  const keys = [];
  let loads = 0;
  const r = createRenderer({
    'react-native': { ...native, StyleSheet: { create: (v) => v } },
    '../AnaliseAutomatica': {
      __esModule: true,
      default: ({ refreshKey }) => {
        keys.push(refreshKey);
        return null;
      },
    },
    '../../../api/client': { apiClient: {} },
    '../../../api/tokenStorage': { tokenStorage: {} },
    '../../../services/historicoCompraService': {
      criarConsultaHistorico: ({ onChange }) => ({
        consultar() {
          loads++;
          onChange({ status: 'ready', dados: null });
        },
        dispose() {},
        invalidar() {},
      }),
    },
  });
  r.mount(
    r.load('src/components/PurchaseComponents/DescobertasCompra/index.js')
      .default,
    { compraId: 1, revisao: 0, compact: true, refreshKey: 3 },
  );
  await r.flush();
  const before = keys.at(-1);
  r.nodes(
    (n) => n.props.accessibilityLabel === 'Atualizar descobertas',
  )[0].props.onPress();
  await r.flush();
  assert.equal(loads, 2);
  assert.notEqual(keys.at(-1), before);
  r.unmount();
});
