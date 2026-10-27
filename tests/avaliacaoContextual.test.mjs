import test from 'node:test';
import assert from 'node:assert/strict';
import {
  criarConsultaAvaliacao,
  validarAvaliacao,
} from '../src/services/avaliacaoCompraService.js';
import { createRenderer } from './helpers/componentRenderer.mjs';
const fact = {
  codigo: 'R1_LIMITE',
  mensagem: 'O valor supera a referência atual.',
  referencias: ['compra:1'],
};
const result = (extra = {}) => ({
  versaoContrato: 1,
  versaoMotor: 'contextual-1',
  compraId: 1,
  contextoRevisao: 1,
  estado: 'CONTEXTO_DISPONIVEL',
  observacoes: [fact],
  declaracoes: [
    {
      ...fact,
      codigo: 'R2_PLANEJAMENTO',
      campo: 'planejamento',
      valor: 'NAO',
      mensagem: 'Você informou que não planejou.',
    },
  ],
  autopercepcao: {
    ...fact,
    campo: 'autopercepcaoImpulsividade',
    valor: 'SIM',
    mensagem: 'Na sua autopercepção, houve impulso.',
  },
  interpretacao: {
    mensagem: 'Contexto declarado.',
    reflexao: 'Gostaria de refletir?',
    referencias: ['compra:1'],
  },
  evidencias: [{ referencia: 'compra:1', natureza: 'REGISTRADO' }],
  limitacoes: ['NAO_DIAGNOSTICA_IMPULSIVIDADE'],
  regrasAplicadas: [
    {
      codigo: 'R1_LIMITE',
      versao: 1,
      justificativa: 'Comparação financeira.',
      referencias: ['compra:1'],
    },
  ],
  ...extra,
});
test('versioned contextual reflection accepts legacy and current engines without rewriting the payload', () => {
  for (const versaoMotor of ['contextual-1', 'contextual-2']) {
    const d = response({ resultado: result({ versaoMotor }) });
    assert.equal(validarAvaliacao(d, 1), d);
    assert.equal(d.resultado.versaoMotor, versaoMotor);
  }
});
const response = (extra = {}) => ({
  versaoContrato: 1,
  compraId: 1,
  atualidade: 'VIGENTE',
  motivos: [],
  avaliacaoId: 1,
  criadaEm: '2026-10-24T12:00:00Z',
  resultado: result(),
  ...extra,
});
function service(overrides = {}) {
  let state;
  const calls = [],
    controller = new AbortController();
  const client = {
    get: async (...args) => {
      calls.push(args);
      return { data: response() };
    },
    post: async (...args) => {
      calls.push(args);
      return { data: response() };
    },
    ...overrides,
  };
  const storage = {
    captureSession: async () => ({ id: 1, signal: controller.signal }),
    assertSession: () => {
      if (controller.signal.aborted) throw Error('session');
    },
  };
  const instance = criarConsultaAvaliacao({
    compraId: 1,
    client,
    storage,
    onChange: (s) => {
      state = s;
    },
  });
  return {
    instance,
    calls,
    state: () => state,
    revoke: () => controller.abort(),
    client,
    storage,
  };
}
test('assessment consultation uses captured session and explicit calculation uses expected revision', async () => {
  const h = service();
  await h.instance.consultar();
  assert.equal(h.state().status, 'ready');
  assert.equal(h.calls[0][0], '/v2/compras/1/avaliacoes/atual');
  await h.instance.calcular(1);
  assert.deepEqual(h.calls[1][1], { revisaoEsperada: 1 });
  assert.equal(h.calls[1][2].rf017SessionId, 1);
  h.instance.dispose();
});
test('invalid result, foreign purchase, version and malformed arrays are refused', () => {
  for (const v of [
    {},
    response({ compraId: 2 }),
    response({ resultado: result({ versaoMotor: 'old' }) }),
    response({ resultado: result({ declaracoes: null }) }),
    response({ resultado: null }),
  ])
    assert.throws(() => validarAvaliacao(v, 1));
  assert.equal(
    validarAvaliacao(
      response({
        atualidade: 'SEM_AVALIACAO',
        avaliacaoId: null,
        criadaEm: null,
        resultado: null,
      }),
      1,
    ).resultado,
    null,
  );
});
test('HTTP errors and 409 are explicit; calculation never retries silently', async () => {
  for (const status of [500, 409]) {
    let writes = 0;
    const h = service({
      post: async () => {
        writes++;
        throw { response: { status } };
      },
    });
    await h.instance.calcular(1);
    assert.equal(h.state().status, status === 409 ? 'conflict' : 'error');
    assert.equal(writes, 1);
    h.instance.dispose();
  }
});
test('session revocation clears result; late POST response cannot restore it', async () => {
  let resolve;
  const h = service({
    post: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  await h.instance.consultar();
  const p = h.instance.calcular(1);
  await new Promise((r) => setImmediate(r));
  h.revoke();
  assert.equal(h.state().dados, null);
  resolve({ data: response() });
  await p;
  assert.equal(h.state().status, 'session');
  assert.equal(h.state().dados, null);
  h.instance.dispose();
});
test('component disposal discards late result and duplicate taps share busy guard', async () => {
  let resolve,
    count = 0;
  const h = service({
    post: () => {
      count++;
      return new Promise((r) => {
        resolve = r;
      });
    },
  });
  const p = h.instance.calcular(1);
  await new Promise((r) => setImmediate(r));
  await h.instance.calcular(1);
  assert.equal(count, 1);
  h.instance.dispose();
  resolve({ data: response() });
  await p;
  assert.notEqual(h.state().status, 'ready');
});
test('calculation with mismatched contextual revision is rejected', async () => {
  const h = service({
    post: async () => ({
      data: response({ resultado: result({ contextoRevisao: 2 }) }),
    }),
  });
  await h.instance.calcular(1);
  assert.equal(h.state().status, 'error');
  h.instance.dispose();
});
const text = (n) =>
  n == null
    ? ''
    : typeof n === 'object'
      ? (n.props?.children ?? []).map(text).join(' ')
      : String(n);
function screen(data = response()) {
  const h = service({ get: async () => ({ data }) });
  const native = Object.fromEntries(
    ['View', 'Text', 'Pressable', 'ActivityIndicator'].map((k) => [k, k]),
  );
  native.StyleSheet = { create: (v) => v };
  const renderer = createRenderer({
    'react-native': native,
    '../../../api/client': { apiClient: h.client },
    '../../../api/tokenStorage': { tokenStorage: h.storage },
  });
  renderer.mount(
    renderer.load(
      'src/components/PurchaseComponents/AvaliacaoContextual/index.js',
    ).default,
    { compraId: 1, revisao: 1 },
  );
  return { ...h, renderer };
}
test('actual Mobile component separates observation declaration reflection and self-perception', async () => {
  const h = screen();
  await h.renderer.flush();
  assert.equal(
    h.renderer.nodes(
      (n) => n.type === 'Text' && text(n) === 'O que o PLENNA observou',
    ).length,
    0,
  );
  h.renderer
    .nodes(
      (n) =>
        n.type === 'Pressable' && text(n) === 'Como chegamos a esta reflexão',
    )[0]
    .props.onPress();
  await h.renderer.flush();
  for (const title of [
    'O que o PLENNA observou',
    'O que você informou',
    'Reflexão sugerida',
    'Sua autopercepção',
  ])
    assert.ok(
      h.renderer.nodes((n) => n.type === 'Text' && text(n) === title).length,
      title,
    );
  assert.ok(
    h.renderer.nodes(
      (n) => n.type === 'Text' && text(n) === 'Gostaria de refletir?',
    ).length,
  );
  h.renderer.unmount();
});
test('actual Mobile component suppresses outdated interpretation; contextual revision also protects rendering', async () => {
  for (const data of [
    response({
      atualidade: 'DESATUALIZADA',
      motivos: ['DADOS_UTILIZADOS_ALTERADOS'],
    }),
    response({ resultado: result({ contextoRevisao: 2 }) }),
  ]) {
    const h = screen(data);
    await h.renderer.flush();
    assert.ok(
      h.renderer.nodes(
        (n) => n.type === 'Text' && text(n).includes('desatualizada'),
      ).length,
    );
    assert.equal(
      h.renderer.nodes(
        (n) => n.type === 'Text' && text(n) === 'Gostaria de refletir?',
      ).length,
      0,
    );
    h.renderer.unmount();
  }
});
test('actual Mobile component offers optional generation and hides results after session change', async () => {
  const h = screen(
    response({
      atualidade: 'SEM_AVALIACAO',
      resultado: null,
      avaliacaoId: null,
      criadaEm: null,
    }),
  );
  await h.renderer.flush();
  assert.ok(
    h.renderer.nodes(
      (n) => n.type === 'Pressable' && text(n) === 'Gerar reflexão opcional',
    ).length,
  );
  h.revoke();
  await h.renderer.flush();
  assert.equal(h.renderer.nodes((n) => n.type === 'Pressable').length, 0);
  h.renderer.unmount();
});
