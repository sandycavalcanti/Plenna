import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  criarEditorContexto,
  validarContexto,
  validarPerguntas,
} from '../src/services/contextoCompraService.js';
import { createRenderer } from './helpers/componentRenderer.mjs';
const d = ['SIM', 'NAO', 'NAO_LEMBRO', 'PREFIRO_NAO_RESPONDER'];
const vals = (k) =>
  k === 'planejamento'
    ? [...d, 'PARCIALMENTE']
    : k === 'momento'
      ? [
          'ANTECIPADA',
          'ADIADA',
          'NO_MOMENTO_PREVISTO',
          'NAO_LEMBRO',
          'PREFIRO_NAO_RESPONDER',
        ]
      : d;
const fields = [
  'planejamento',
  'influenciaPromocional',
  'necessidadeInesperada',
  'momento',
  'autopercepcaoImpulsividade',
];
const c = (extra = {}) => ({
  versaoContrato: 1,
  compraId: 1,
  revisao: 0,
  criadaEm: extra.revisao > 0 ? '2026-10-25T12:00:00.000Z' : null,
  respostas: {},
  itens: [],
  ...extra,
});
const p = (extra = {}) => ({
  versaoContrato: 1,
  versaoCatalogo: 'contexto-1',
  compraId: 1,
  revisao: 0,
  catalogo: fields.map((campo) => ({
    codigo: campo,
    campo,
    versao: 1,
    texto: campo,
    opcoes: vals(campo).map((valor) => ({ valor, texto: valor })),
  })),
  perguntas: [{ codigo: 'planejamento', motivo: 'CONTEXTO_NAO_INFORMADO' }],
  itens: [{ itemId: 10, nome: 'Livro' }],
  planejamentoItemOpcoes: vals('planejamento').map((valor) => ({
    valor,
    texto: valor,
  })),
  ...extra,
});
function setup(overrides = {}) {
  let current = c(),
    questions = p(),
    controller = new AbortController(),
    valid = true,
    uuid = 0;
  const changes = [],
    calls = [];
  const client = {
    get: async (url, config) => {
      calls.push({ url, config });
      return { data: url.endsWith('/contexto') ? current : questions };
    },
    patch: async (url, body, config) => {
      calls.push({ url, body, config });
      current = c({ revisao: 1, respostas: body.respostas, itens: body.itens });
      questions = p({ revisao: 1 });
      return { data: current };
    },
    ...overrides,
  };
  const storage = {
    captureSession: async () => ({ id: 7, signal: controller.signal }),
    assertSession: (id) => {
      if (!valid || id !== 7) throw Error('SESSION_INVALID');
    },
  };
  const editor = criarEditorContexto({
    compraId: 1,
    client,
    storage,
    uuid: () => `operation-${++uuid}`,
    onChange: (s) => changes.push(s),
  });
  return {
    editor,
    client,
    calls,
    changes,
    revoke() {
      valid = false;
      controller.abort();
    },
    set(c1, p1) {
      current = c1;
      questions = p1;
    },
  };
}
test('loads both authenticated endpoints with captured session', async () => {
  const h = setup();
  await h.editor.load();
  assert.equal(h.editor.getState().status, 'ready');
  assert.equal(h.calls.length, 2);
  assert.ok(
    h.calls.every((c) => c.config.rf017SessionId === 7 && c.config.signal),
  );
  h.editor.dispose();
});
test('validates malformed, mismatched and unsupported responses before rendering', () => {
  for (const bad of [
    {},
    c({ compraId: 2 }),
    c({ respostas: { planejamento: 'INVALIDO' } }),
    c({ itens: [{ itemId: 0, planejamento: 'SIM' }] }),
  ])
    assert.throws(() => validarContexto(bad, 1));
  for (const bad of [
    {},
    p({ revisao: 1 }),
    p({ catalogo: [] }),
    p({ perguntas: [{ codigo: 'planejamentoItem', itemId: 99, motivo: 'x' }] }),
  ])
    assert.throws(() => validarPerguntas(bad, c()));
});
test('network or invalid contract produces error, never empty ready state', async () => {
  for (const get of [
    async () => {
      throw Error('offline');
    },
    async () => ({ data: {} }),
  ]) {
    const h = setup({ get });
    await h.editor.load();
    assert.equal(h.editor.getState().status, 'error');
    assert.equal(h.editor.getState().dados, null);
    h.editor.dispose();
  }
});
test('save partial planning and item changes, then reload current revision', async () => {
  const h = setup();
  await h.editor.load();
  await h.editor.save({ planejamento: 'PARCIALMENTE' }, [
    { itemId: 10, planejamento: 'SIM' },
  ]);
  const write = h.calls.find((c) => c.body);
  assert.equal(write.body.revisaoEsperada, 0);
  assert.equal(write.body.respostas.planejamento, 'PARCIALMENTE');
  assert.equal(h.editor.getState().dados.contexto.revisao, 1);
  assert.equal(h.calls.length, 4);
  h.editor.dispose();
});
test('removal is sent as null without manufacturing omitted responses', async () => {
  const h = setup({
    patch: async (_url, body) => ({ data: c({ revisao: 1 }) }),
  });
  await h.editor.load();
  await h.editor.save({ planejamento: null }, [
    { itemId: 10, planejamento: null },
  ]);
  // Capture via replacement to inspect exact sparse patch.
  h.editor.dispose();
  let sent;
  const x = setup({
    patch: async (_u, body) => {
      sent = body;
      return { data: c({ revisao: 1 }) };
    },
  });
  await x.editor.load();
  await x.editor.save({ planejamento: null }, [
    { itemId: 10, planejamento: null },
  ]);
  assert.deepEqual(sent.respostas, { planejamento: null });
  assert.deepEqual(sent.itens, [{ itemId: 10, planejamento: null }]);
  x.editor.dispose();
});
test('409 preserves editor data and blocks blind retry until reload', async () => {
  let writes = 0;
  const h = setup({
    patch: async () => {
      writes++;
      throw { response: { status: 409 } };
    },
  });
  await h.editor.load();
  await h.editor.save({ planejamento: 'SIM' }, []);
  assert.equal(h.editor.getState().status, 'conflict');
  await h.editor.save({ planejamento: 'SIM' }, []);
  assert.equal(writes, 1);
  h.editor.dispose();
});
test('uncertain save retry reuses operation UUID and unchanged payload', async () => {
  const bodies = [];
  const h = setup({
    patch: async (_url, body) => {
      bodies.push(body);
      throw Error('offline');
    },
  });
  await h.editor.load();
  await h.editor.save({ planejamento: 'SIM' }, []);
  await h.editor.save({ planejamento: 'SIM' }, []);
  assert.equal(h.editor.getState().status, 'saveError');
  assert.deepEqual(bodies[0], bodies[1]);
  h.editor.dispose();
});
test('session revocation clears loaded data and prevents writes', async () => {
  const h = setup();
  await h.editor.load();
  h.revoke();
  assert.equal(h.editor.getState().dados, null);
  assert.equal(h.editor.getState().status, 'session');
  await h.editor.save({ planejamento: 'SIM' }, []);
  assert.ok(!h.calls.some((c) => c.body));
  h.editor.dispose();
});
test('late responses after revocation or disposal never restore purchase data', async () => {
  for (const revoke of [true, false]) {
    const pending = [];
    const h = setup({
      get: (url) =>
        new Promise((resolve) =>
          pending.push(() =>
            resolve({ data: url.endsWith('/contexto') ? c() : p() }),
          ),
        ),
    });
    const load = h.editor.load();
    await new Promise((r) => setImmediate(r));
    if (revoke) h.revoke();
    else h.editor.dispose();
    pending.forEach((f) => f());
    await load;
    assert.equal(h.editor.getState().dados, null);
    h.editor.dispose();
  }
});
test('response mismatch between context and selector is rejected', async () => {
  const h = setup();
  h.set(c(), p({ revisao: 2 }));
  await h.editor.load();
  assert.equal(h.editor.getState().status, 'error');
  h.editor.dispose();
});
test('session change during PATCH discards result without fetching another user context', async () => {
  let resolve;
  const h = setup({
    patch: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  await h.editor.load();
  const saving = h.editor.save({ planejamento: 'SIM' }, []);
  await new Promise((r) => setImmediate(r));
  h.revoke();
  resolve({ data: c({ revisao: 1, respostas: { planejamento: 'SIM' } }) });
  await saving;
  assert.equal(h.editor.getState().status, 'session');
  assert.equal(h.editor.getState().dados, null);
  assert.equal(h.calls.length, 2);
  h.editor.dispose();
});

const text = (n) =>
  n == null || typeof n === 'boolean'
    ? ''
    : typeof n === 'object'
      ? (n.props?.children ?? []).map(text).join('')
      : String(n);
function screen({
  conflict = false,
  initial = c(),
  historico = null,
  nativeOverrides = {},
  etapaInicial = 'responder',
  items = p().itens,
} = {}) {
  let current = initial,
    closed = 0;
  const writes = [];
  const controller = new AbortController();
  const client = {
    get: async (url) => ({
      data:
        historico && url.endsWith('/indicadores-historicos')
          ? historico
          : historico && url.endsWith('/avaliacoes/atual')
            ? {
                versaoContrato: 1,
                compraId: 1,
                atualidade: 'VIGENTE',
                motivos: [],
                avaliacaoId: 4,
                criadaEm: historico.consultadoEm,
                resultado: historico.contextual,
              }
            : url.endsWith('/contexto')
              ? current
              : p({
                  revisao: current.revisao,
                  perguntas: fields
                    .filter(
                      (c) =>
                        current.respostas[c] === undefined &&
                        (c !== 'momento' ||
                          ['SIM', 'PARCIALMENTE'].includes(
                            current.respostas.planejamento,
                          ) ||
                          current.respostas.influenciaPromocional === 'SIM'),
                    )
                    .map((codigo) => ({ codigo, motivo: 'x' })),
                }),
    }),
    patch: async (_url, body) => {
      writes.push(body);
      if (conflict) throw { response: { status: 409 } };
      const respostas = { ...current.respostas };
      for (const [k, v] of Object.entries(body.respostas)) {
        if (v === null) delete respostas[k];
        else respostas[k] = v;
      }
      current = c({
        revisao: current.revisao + 1,
        respostas,
        itens: body.itens.filter((i) => i.planejamento !== null),
        ...(body.eventosPosteriores === undefined
          ? {}
          : { eventosPosteriores: body.eventosPosteriores }),
      });
      return { data: current };
    },
  };
  const alerts = [];
  const native = Object.fromEntries(
    [
      'ActivityIndicator',
      'Modal',
      'Pressable',
      'ScrollView',
      'Text',
      'View',
    ].map((k) => [k, k]),
  );
  native.StyleSheet = { create: (v) => v };
  native.Alert = { alert: (...args) => alerts.push(args) };
  const get = client.get;
  client.get = async (url) => {
    const response = await get(url);
    if (url.endsWith('/perguntas'))
      response.data = { ...response.data, itens: items };
    return response;
  };
  Object.assign(native, nativeOverrides);
  const h = createRenderer({
    'react-native': native,
    'expo-crypto': { randomUUID: () => 'ui-operation' },
    '../../../api/client': { apiClient: client },
    '../../../api/tokenStorage': {
      tokenStorage: {
        captureSession: async () => ({ id: 1, signal: controller.signal }),
        assertSession: () => {
          if (controller.signal.aborted) throw Error('session');
        },
      },
    },
  });
  h.mount(
    h.load('src/components/PurchaseComponents/ContextoCompra/index.js').default,
    {
      compraId: 1,
      ...(etapaInicial === null ? {} : { etapaInicial }),
      onClose: () => {
        closed++;
      },
    },
  );
  const press = (label) => {
    const node = h.nodes((n) => n.type === 'Pressable' && text(n) === label)[0];
    assert.ok(node, 'missing ' + label);
    assert.ok(!node.props.disabled, 'disabled ' + label);
    node.props.onPress();
  };
  return {
    h,
    writes,
    press,
    alerts,
    revoke: () => controller.abort(),
    closed: () => closed,
    client,
    controller,
  };
}

test('wizard presents one question and dynamic progress; partial planning retains item planning on save', async () => {
  const s = screen();
  await s.h.flush();
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'planejamento').length,
  );
  assert.equal(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'influenciaPromocional')
      .length,
    0,
  );
  s.press('Em parte');
  await s.h.flush();
  s.press('Adicionar mais contexto');
  await s.h.flush();
  assert.equal(
    s.h.nodes((n) => n.props.accessibilityRole === 'progressbar')[0].props
      .accessibilityValue.max,
    6,
  );
  for (let i = 0; i < 5; i++) {
    s.press('Continuar →');
    await s.h.flush();
  }
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n).includes('E Livro,')).length,
  );
  s.press('SIM');
  await s.h.flush();
  s.press('Salvar e descobrir');
  await s.h.flush();
  assert.equal(s.writes[0].respostas.planejamento, 'PARCIALMENTE');
  assert.deepEqual(s.writes[0].itens, [{ itemId: 10, planejamento: 'SIM' }]);
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'O PLENNA observou')
      .length,
  );
  s.h.unmount();
});
test('skip and previous navigation preserve optional choices without manufacturing answers', async () => {
  const s = screen();
  await s.h.flush();
  s.press('Pular por enquanto');
  await s.h.flush();
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'influenciaPromocional')
      .length,
  );
  s.h.nodes((n) => n.props.accessibilityLabel === 'Voltar')[0].props.onPress();
  await s.h.flush();
  s.press('SIM');
  await s.h.flush();
  s.press('Continuar →');
  await s.h.flush();
  s.h.nodes((n) => n.props.accessibilityLabel === 'Voltar')[0].props.onPress();
  await s.h.flush();
  assert.equal(
    s.h.nodes(
      (n) => n.props.accessibilityRole === 'radio' && text(n).startsWith('SIM'),
    )[0].props.accessibilityState.checked,
    true,
  );
  assert.equal(s.writes.length, 0);
  s.press('Concluir por agora');
  await s.h.flush();
  assert.deepEqual(s.writes[0].respostas, { planejamento: 'SIM' });
  s.h.unmount();
});
test('review supports explicit removal and conflicts require confirmed reload', async () => {
  const s = screen({
    conflict: true,
    initial: c({ revisao: 2, respostas: { planejamento: 'SIM' } }),
  });
  await s.h.flush();
  s.press('Concluir por agora');
  await s.h.flush();
  s.press('Revisar percepção');
  await s.h.flush();
  s.press('Remover resposta');
  await s.h.flush();
  s.press('Concluir por agora');
  await s.h.flush();
  assert.equal(s.writes[0].revisaoEsperada, 2);
  assert.deepEqual(s.writes[0].respostas, { planejamento: null });
  s.press('Recarregar contexto');
  assert.equal(s.writes.length, 1);
  s.alerts
    .at(-1)[2]
    .find((b) => b.text === 'Recarregar')
    .onPress();
  await s.h.flush();
  assert.equal(s.writes.length, 1);
  s.h.unmount();
});
test('closing an edited question offers saving or session draft; reopening resumes and logout clears it', async () => {
  const s = screen();
  await s.h.flush();
  s.press('SIM');
  await s.h.flush();
  s.h.nodes((n) => n.props.accessibilityLabel === 'Fechar')[0].props.onPress();
  assert.equal(s.closed(), 0);
  s.alerts
    .at(-1)[2]
    .find((b) => b.text === 'Guardar para depois')
    .onPress();
  assert.equal(s.closed(), 1);
  const component = s.h.load(
    'src/components/PurchaseComponents/ContextoCompra/index.js',
  ).default;
  s.h.unmount();
  s.h.mount(component, {
    compraId: 1,
    etapaInicial: 'responder',
    onClose: () => {},
  });
  await s.h.flush();
  assert.ok(
    s.h.nodes(
      (n) => n.type === 'Text' && text(n) === 'Suas escolhas foram retomadas.',
    ).length,
  );
  assert.equal(
    s.h.nodes(
      (n) => n.props.accessibilityRole === 'radio' && text(n).startsWith('SIM'),
    )[0].props.accessibilityState.checked,
    true,
  );
  s.revoke();
  await s.h.flush();
  assert.equal(
    s.h.nodes((n) => n.props.accessibilityRole === 'radio').length,
    0,
  );
  s.h.unmount();
});
test('four areas retain versioned reflection independently without duplicate exploration', async () => {
  const s = screen({ initial: c({ revisao: 1 }) });
  await s.h.flush();
  s.press('Concluir por agora');
  await s.h.flush();
  for (const title of [
    'O PLENNA observou',
    'Sua percepção',
    'Histórico e gerenciamento',
  ])
    assert.ok(
      s.h.nodes((n) => n.type === 'Text' && text(n) === title).length,
      title,
    );
  assert.equal(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'Explorar minha compra →')
      .length,
    0,
  );
  s.press('Reflexão registrada');
  await s.h.flush();
  assert.ok(
    s.h.nodes(
      (n) => n.type === 'Text' && text(n).includes('não está disponível agora'),
    ).length,
  );
  assert.equal(s.writes.length, 0);
  s.h.unmount();
});
test('empty adaptive invitation set opens the summary without a blank question step', async () => {
  const s = screen({
    initial: c({
      respostas: {
        planejamento: 'NAO',
        influenciaPromocional: 'NAO',
        necessidadeInesperada: 'NAO',
        autopercepcaoImpulsividade: 'NAO',
      },
    }),
  });
  await s.h.flush();
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'O PLENNA observou')
      .length,
  );
  assert.equal(
    s.h.nodes((n) => n.props.accessibilityRole === 'radio').length,
    0,
  );
  s.h.unmount();
});

test('default entry shows automatic observations before any optional question; answering remains explicit', async () => {
  const historico = JSON.parse(
    readFileSync(
      new URL('./fixtures/historicoCompra.json', import.meta.url),
      'utf8',
    ),
  );
  historico.contextual.contextoRevisao = 0;
  historico.dependenciasHistoricas.contextoRevisao = 0;
  historico.descobertas = {
    versao: 'automaticas-1',
    itens: [
      {
        codigo: 'VALOR_REGISTRADO',
        natureza: 'REGISTRADO',
        titulo: 'R$ 100,00',
        detalhe: 'Valor líquido registrado nesta compra.',
        referencias: ['compra:1'],
      },
    ],
    reflexao: null,
    perguntasSugeridas: [],
    eventosPosteriores: [],
    limitacoes: [],
  };
  const s = screen({ historico, etapaInicial: null });
  await s.h.flush();
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'O PLENNA observou')
      .length,
  );
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'R$ 100,00').length,
  );
  assert.equal(
    s.h.nodes((n) => n.props.accessibilityRole === 'radio').length,
    0,
  );
  assert.equal(s.writes.length, 0);
  s.press('Adicionar contexto · opcional');
  await s.h.flush();
  assert.ok(s.h.nodes((n) => n.props.accessibilityRole === 'radio').length);
  s.h.unmount();
});
test('management is separate from optional contextual answers', async () => {
  const s = screen({
    initial: c({ revisao: 1, respostas: { planejamento: 'SIM' } }),
  });
  await s.h.flush();
  s.press('Concluir por agora');
  await s.h.flush();
  assert.ok(
    s.h.nodes(
      (n) => n.type === 'Text' && text(n) === 'Eventos e operações da compra',
    ).length,
  );
  assert.equal(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'Atualizar situação')
      .length,
    0,
  );
  assert.equal(s.writes.length, 0);
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'Planejada').length,
  );
  s.h.unmount();
});
test('a failed question service never blocks automatic analysis or history exploration', async () => {
  const historico = JSON.parse(
    readFileSync(
      new URL('./fixtures/historicoCompra.json', import.meta.url),
      'utf8',
    ),
  );
  historico.descobertas = {
    versao: 'automaticas-1',
    itens: [
      {
        codigo: 'VALOR_REGISTRADO',
        natureza: 'REGISTRADO',
        titulo: 'R$ 100,00',
        detalhe: 'Valor registrado.',
        referencias: ['compra:1'],
      },
    ],
    reflexao: null,
    perguntasSugeridas: [],
    eventosPosteriores: [],
    limitacoes: [],
  };
  const s = screen({ etapaInicial: null });
  s.client.get = async (url) => {
    if (url.endsWith('/indicadores-historicos')) return { data: historico };
    throw Error('questions unavailable');
  };
  await s.h.flush();
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'R$ 100,00').length,
  );
  assert.ok(
    s.h.nodes(
      (n) => n.type === 'Text' && text(n) === 'Eventos e operações da compra',
    ).length,
  );
  assert.equal(s.writes.length, 0);
  s.h.unmount();
});

test('save and exit waits for persistence; Android Back navigates questions before closing', async () => {
  const s = screen();
  await s.h.flush();
  s.press('SIM');
  await s.h.flush();
  s.press('Continuar →');
  await s.h.flush();
  s.h.nodes((n) => n.type === 'Modal')[0].props.onRequestClose();
  await s.h.flush();
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'planejamento').length,
  );
  assert.equal(s.closed(), 0);
  s.h.nodes((n) => n.props.accessibilityLabel === 'Fechar')[0].props.onPress();
  s.alerts
    .at(-1)[2]
    .find((b) => b.text === 'Salvar e sair')
    .onPress();
  assert.equal(s.closed(), 0);
  await s.h.flush();
  assert.equal(s.closed(), 1);
  assert.deepEqual(s.writes[0].respostas, { planejamento: 'SIM' });
  s.h.unmount();
});
test('question transitions honor reduced motion and expose radio/progress accessibility', async () => {
  for (const reduced of [true, false]) {
    let animations = 0;
    const nativeOverrides = {
      AccessibilityInfo: {
        isReduceMotionEnabled: async () => reduced,
        addEventListener: () => ({ remove() {} }),
      },
      Animated: {
        Value: class {
          setValue() {}
        },
        View: 'AnimatedView',
        timing: () => ({
          start() {
            animations++;
          },
          stop() {},
        }),
      },
    };
    const s = screen({ nativeOverrides });
    await s.h.flush();
    const before = animations;
    s.press('Pular por enquanto');
    await s.h.flush();
    assert.equal(animations > before, !reduced);
    const progress = s.h.nodes(
      (n) => n.props.accessibilityRole === 'progressbar',
    )[0];
    assert.equal(progress.props.accessibilityValue.now, 2);
    assert.ok(
      s.h
        .nodes((n) => n.props.accessibilityRole === 'radio')
        .every((n) => n.props.accessibilityState.checked === false),
    );
    s.h.unmount();
  }
});

test('full and refused answers receive a committed acknowledgement', async () => {
  for (const answer of ['SIM', 'PREFIRO_NAO_RESPONDER']) {
    const h = setup();
    await h.editor.load();
    const respostas = {
      planejamento: 'PARCIALMENTE',
      influenciaPromocional: answer,
      necessidadeInesperada: answer,
      momento: 'NAO_LEMBRO',
      autopercepcaoImpulsividade: answer,
    };
    const itens = [{ itemId: 10, planejamento: answer }];
    await h.editor.save(respostas, itens);
    assert.ok(h.changes.some((s) => s.salvo && s.dados.contexto.revisao === 1));
    assert.deepEqual(h.editor.getState().dados.contexto.respostas, respostas);
    h.editor.dispose();
  }
});

test('HTTP failures preserve loaded context and expose only a safe diagnostic', async () => {
  for (const [status, tipo] of [
    [400, 'VALIDACAO'],
    [422, 'VALIDACAO'],
    [401, 'AUTENTICACAO'],
    [403, 'PERMISSAO'],
    [404, 'INDISPONIVEL'],
    [500, 'SERVIDOR'],
  ]) {
    const h = setup({
      patch: async () => {
        throw { response: { status, data: { secret: 'never-display' } } };
      },
    });
    await h.editor.load();
    await h.editor.save({ planejamento: 'SIM' }, []);
    const s = h.editor.getState();
    assert.equal(s.status, 'saveError');
    assert.equal(s.dados.contexto.revisao, 0);
    assert.deepEqual(s.diagnostico, {
      metodo: 'PATCH',
      endpoint: '/v2/compras/:compraId/contexto',
      statusHttp: status,
      tipo,
    });
    assert.ok(!JSON.stringify(s).includes('never-display'));
    assert.ok(!h.changes.some((s) => s.salvo));
    h.editor.dispose();
  }
});

test('unexpected acknowledgements never advance and retries keep the same operation', async () => {
  for (const bad of [
    {},
    c({ revisao: 1, criadaEm: null, respostas: { planejamento: 'SIM' } }),
    c({ revisao: 0, respostas: { planejamento: 'SIM' } }),
    c({ revisao: 1 }),
  ]) {
    const bodies = [];
    const h = setup({
      patch: async (_u, body) => {
        bodies.push(body);
        return { data: bad };
      },
    });
    await h.editor.load();
    await h.editor.save({ planejamento: 'SIM' }, []);
    await h.editor.save({ planejamento: 'SIM' }, []);
    assert.equal(h.editor.getState().diagnostico.tipo, 'CONTRATO');
    assert.ok(!h.changes.some((s) => s.salvo));
    assert.deepEqual(bodies[0], bodies[1]);
    h.editor.dispose();
  }
});

test('lost acknowledgement retries the committed operation once and reopens the saved revision', async () => {
  let persisted,
    operation,
    writes = 0;
  const bodies = [];
  const h = setup({
    patch: async (_u, body) => {
      bodies.push(body);
      if (!persisted) {
        writes++;
        operation = body.operacaoId;
        persisted = c({
          revisao: 1,
          respostas: body.respostas,
          itens: body.itens,
        });
        throw Error('connection lost after commit');
      }
      assert.equal(body.operacaoId, operation);
      return { data: persisted };
    },
  });
  await h.editor.load();
  await h.editor.save({ planejamento: 'SIM' }, []);
  assert.equal(h.editor.getState().status, 'saveError');
  h.set(persisted, p({ revisao: 1 }));
  await h.editor.save({ planejamento: 'SIM' }, []);
  assert.equal(writes, 1);
  assert.deepEqual(bodies[0], bodies[1]);
  assert.ok(h.changes.some((s) => s.salvo));
  await h.editor.load();
  assert.equal(
    h.editor.getState().dados.contexto.respostas.planejamento,
    'SIM',
  );
  assert.equal(h.editor.getState().dados.contexto.revisao, 1);
  h.editor.dispose();
});

test('confirmation is immediate and independent of a later failed question refresh', async () => {
  const h = setup();
  await h.editor.load();
  let fail;
  h.client.get = () =>
    new Promise((_resolve, reject) => {
      fail = reject;
    });
  const saving = h.editor.save({ planejamento: 'SIM' }, []);
  await new Promise((r) => setImmediate(r));
  assert.ok(h.changes.some((s) => s.salvo));
  assert.equal(h.editor.getState().status, 'ready');
  fail(Error('questions unavailable'));
  await saving;
  assert.equal(h.editor.getState().status, 'ready');
  assert.equal(h.editor.getState().error, null);
  assert.match(h.editor.getState().perguntasError, /Respostas salvas/);
  h.editor.dispose();
});

test('successful save advances to Discover even when reflection is unavailable', async () => {
  const s = screen();
  await s.h.flush();
  s.press('SIM');
  await s.h.flush();
  s.press('Concluir por agora');
  await s.h.flush();
  assert.equal(s.writes.length, 1);
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'O PLENNA observou')
      .length,
  );
  s.press('Reflexão registrada');
  await s.h.flush();
  assert.ok(
    s.h.nodes(
      (n) => n.type === 'Text' && text(n).includes('não está disponível agora'),
    ).length,
  );
  assert.equal(s.writes.length, 1);
  s.h.unmount();
});

test('question seven of seven saves both item plans and advances only after acknowledgement', async () => {
  const s = screen({
    items: [
      { itemId: 10, nome: 'Livro' },
      { itemId: 11, nome: 'Caneta' },
    ],
  });
  await s.h.flush();
  s.press('Em parte');
  await s.h.flush();
  s.press('Adicionar mais contexto');
  await s.h.flush();
  for (let i = 0; i < 6; i++) {
    s.press('Continuar →');
    await s.h.flush();
  }
  const progress = s.h.nodes(
    (n) => n.props.accessibilityRole === 'progressbar',
  )[0].props.accessibilityValue;
  assert.equal(progress.now, 7);
  assert.equal(progress.max, 7);
  s.press('SIM');
  await s.h.flush();
  s.press('Salvar e descobrir');
  await s.h.flush();
  assert.ok(
    s.writes[0].itens.some((i) => i.itemId === 11 && i.planejamento === 'SIM'),
  );
  assert.ok(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'O PLENNA observou')
      .length,
  );
  s.h.unmount();
});

test('network failure retains selected answers in the question and allows retry', async () => {
  const s = screen();
  await s.h.flush();
  s.press('SIM');
  await s.h.flush();
  const patch = s.client.patch;
  s.client.patch = async () => {
    throw Error('offline');
  };
  s.press('Concluir por agora');
  await s.h.flush();
  assert.ok(
    s.h.nodes(
      (n) => n.props.accessibilityRole === 'radio' && text(n).startsWith('SIM'),
    )[0].props.accessibilityState.checked,
  );
  assert.equal(
    s.h.nodes((n) => n.type === 'Text' && text(n) === 'O PLENNA observou')
      .length,
    0,
  );
  s.client.patch = patch;
  s.press('Concluir por agora');
  await s.h.flush();
  assert.equal(s.writes.length, 1);
  assert.equal(s.writes[0].respostas.planejamento, 'SIM');
  s.h.unmount();
});

test('optional context starts with at most two questions and expanding preserves the selected answer', async () => {
  const s = screen();
  await s.h.flush();
  assert.equal(
    s.h.nodes((n) => n.props.accessibilityRole === 'progressbar')[0].props
      .accessibilityValue.max,
    2,
  );
  s.press('PREFIRO_NAO_RESPONDER');
  await s.h.flush();
  s.press('Adicionar mais contexto');
  await s.h.flush();
  assert.ok(
    s.h.nodes((n) => n.props.accessibilityRole === 'progressbar')[0].props
      .accessibilityValue.max > 2,
  );
  assert.equal(
    s.h.nodes(
      (n) =>
        n.props.accessibilityRole === 'radio' &&
        text(n).startsWith('PREFIRO_NAO_RESPONDER'),
    )[0].props.accessibilityState.checked,
    true,
  );
  s.press('Concluir por agora');
  await s.h.flush();
  assert.equal(s.writes[0].respostas.planejamento, 'PREFIRO_NAO_RESPONDER');
  s.h.unmount();
});

test('regret remains independently editable without turning it into cancellation or refund', async () => {
  const s = screen({
    initial: c({
      revisao: 1,
      respostas: { planejamento: 'SIM' },
      eventosPosteriores: ['CANCELAMENTO'],
    }),
  });
  await s.h.flush();
  s.press('Concluir por agora');
  await s.h.flush();
  s.press('Arrependimento · opcional');
  await s.h.flush();
  s.press('Informar arrependimento');
  await s.h.flush();
  assert.deepEqual(s.writes[0].eventosPosteriores, [
    'CANCELAMENTO',
    'ARREPENDIMENTO',
  ]);
  assert.deepEqual(s.writes[0].respostas, {});
  assert.deepEqual(s.writes[0].itens, []);
  s.press('Remover declaração de arrependimento');
  await s.h.flush();
  assert.deepEqual(s.writes[1].eventosPosteriores, ['CANCELAMENTO']);
  s.h.unmount();
});
