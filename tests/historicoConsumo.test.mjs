import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  criarConsultaHistorico,
  validarHistoricoCompra,
} from '../src/services/historicoCompraService.js';
import { createRenderer } from './helpers/componentRenderer.mjs';
// Snapshot generated with the API's pure historical and contextual engines; no database.
const fixture = JSON.parse(
  readFileSync(
    new URL('./fixtures/historicoCompra.json', import.meta.url),
    'utf8',
  ),
);
const response = () => structuredClone(fixture);
test('contextual-2 historical complement is accepted only with matching declared dependencies', () => {
  const d = response();
  d.contextual.versaoMotor = 'contextual-2';
  d.dependenciasHistoricas.versaoMotorContextual = 'contextual-2';
  assert.equal(validarHistoricoCompra(d, 1), d);
  d.dependenciasHistoricas.versaoMotorContextual = 'contextual-1';
  assert.throws(() => validarHistoricoCompra(d, 1));
});
const tick = () => new Promise((r) => setImmediate(r));
function setup(overrides = {}) {
  let state;
  const calls = [],
    session = new AbortController();
  const client = {
    get: async (...args) => {
      calls.push(args);
      return { data: response() };
    },
    ...overrides,
  };
  const storage = {
    captureSession: async () => ({ id: 7, signal: session.signal }),
    assertSession: (id) => {
      if (id !== 7 || session.signal.aborted) throw Error('SESSION_REQUIRED');
    },
  };
  const instance = criarConsultaHistorico({
    compraId: 1,
    revisao: 1,
    client,
    storage,
    onChange: (s) => {
      state = s;
    },
  });
  return {
    instance,
    client,
    storage,
    calls,
    state: () => state,
    revoke: () => session.abort(),
  };
}
test('API-generated partial-coverage contract is accepted and fetched under the captured user session', async () => {
  assert.equal(
    validarHistoricoCompra(response(), 1).historico.planejamento.recusadas,
    1,
  );
  const h = setup();
  await h.instance.consultar();
  assert.equal(h.state().status, 'ready');
  assert.equal(h.calls[0][0], '/v2/compras/1/indicadores-historicos');
  assert.equal(h.calls[0][1].rf017SessionId, 7);
  assert.ok(h.calls[0][1].signal);
  h.instance.dispose();
});

function temporalResponse() {
  const d = response(),
    h = d.historico;
  const base = (
    registros,
    inicio = '2026-09-02',
    fimInclusivo = '2026-10-02',
  ) => ({
    registros,
    disponivel: registros ? { inicio, fimInclusivo } : null,
    continuidadeComprovada: false,
  });
  h.politicaTemporal = {
    versao: 'temporal-1',
    solicitado: {
      inicio: h.janelaHistorico.inicio,
      fimExclusivo: h.observadoAte,
    },
    compras: base(2),
    valores: base(2),
    categorias: base(2),
    planejamento: base(1, '2026-09-02', '2026-09-02'),
    influenciaPromocional: base(1, '2026-09-02', '2026-09-02'),
    comparacaoElegivel: false,
  };
  d.dependenciasHistoricas.versaoPoliticaTemporal = 'temporal-1';
  return d;
}
test('optional temporal contract is accepted, rejects inconsistent bounds and preserves old assessments', () => {
  const d = temporalResponse();
  assert.equal(validarHistoricoCompra(d, 1), d);
  for (const mutate of [
    (p) => (p.compras.disponivel.inicio = '2026-03-01'),
    (p) => (p.compras.registros = 20),
    (p) => (p.compras.continuidadeComprovada = true),
    (p) => (p.versao = 'future'),
  ]) {
    const changed = temporalResponse();
    mutate(changed.historico.politicaTemporal);
    assert.throws(() => validarHistoricoCompra(changed, 1));
  }
  assert.deepEqual(d.contextual, fixture.contextual);
  assert.equal(
    validarHistoricoCompra(response(), 1).contextual.versaoMotor,
    'contextual-1',
  );
});
test('available September history never presents April or empty months as observed consumption', async () => {
  const h = screen(temporalResponse());
  await h.renderer.flush();
  assert.ok(h.content().includes('Compras registradas desde setembro de 2026'));
  assert.ok(!h.content().includes('abril'));
  h.press('Explorar histórico');
  await h.renderer.flush();
  assert.ok(!h.content().includes('abril'));
  assert.equal(
    h.renderer.nodes(
      (n) =>
        n.props.accessibilityLabel === 'abril de 2026: 0 compras registradas',
    ).length,
    0,
  );
  assert.ok(h.content().includes('sem resposta conhecida'));
  h.renderer.unmount();
});
test('category exploration selects frequency or attributable amounts, never inventing multicategory allocations', async () => {
  const d = response();
  Object.assign(d.historico.categorias[0], {
    nome: 'Livros',
    valores: {
      comprasAtribuidas: 1,
      totalLiquidoCentavos: 10000,
      comprasMulticategoriaSemRateio: 1,
    },
  });
  const h = screen(d);
  await h.renderer.flush();
  h.press('Explorar histórico');
  await h.renderer.flush();
  assert.ok(h.content().includes('Categorias dos seus registros'));
  h.press('Valores conhecidos');
  await h.renderer.flush();
  assert.ok(h.content().includes('Não distribuímos descontos'));
  const category = h.renderer.nodes(
    (n) => n.props.accessibilityLabel === 'Explorar categoria Livros',
  )[0];
  category.props.onPress();
  await h.renderer.flush();
  assert.ok(h.content().includes('1 com valor atribuído'));
  assert.ok(h.content().includes('1 com mais de uma categoria'));
  h.renderer.unmount();
});
test('missing declarations and financial references do not create empty graphs, placeholder metrics or zero recurrence cards', async () => {
  const d = response(),
    h = d.historico;
  for (const value of [
    h.planejamento,
    h.planejamento.historico,
    h.influenciaPromocional,
    h.influenciaPromocional.historico,
  ]) {
    Object.assign(value, {
      conhecidas: 0,
      ausentes: value.universo,
      recusadas: 0,
      naoLembra: 0,
      cobertura: value.universo ? 0 : null,
      contagens: { SIM: 0, PARCIALMENTE: 0, NAO: 0 },
    });
  }
  Object.assign(h.recorrencias, {
    cadastradas: 0,
    comprasVinculadasAtual: 0,
    comprasVinculadasHistorico: 0,
  });
  d.comparacaoValorCompra.amostra = 1;
  d.comparacaoValorCompra.medianaHistoricaCentavos = null;
  const s = screen(d);
  await s.renderer.flush();
  assert.ok(!s.content().includes('Valor mediano anterior'));
  s.press('Explorar histórico');
  await s.renderer.flush();
  assert.ok(s.content().includes('sem respostas conhecidas'));
  assert.ok(!s.content().includes('Recorrências cadastradas hoje'));
  assert.equal(
    s.renderer.nodes((n) =>
      n.props.accessibilityLabel?.includes('respostas conhecidas'),
    ).length,
    0,
  );
  s.renderer.unmount();
});
test('foreign purchase, unknown versions, invalid coverage and dependencies cannot be rendered', () => {
  const changes = [
    (d) => (d.compraId = 2),
    (d) => (d.versaoComplemento = 'old'),
    (d) => (d.reflexoesHistoricas.versaoRegras = 'new'),
    (d) => (d.historico.planejamento.conhecidas = 20),
    (d) => (d.dependenciasHistoricas.periodo = '2026-09'),
    (d) => (d.dependenciasHistoricas.contextoRevisao = 99),
    (d) => (d.historico = null),
  ];
  for (const mutate of changes) {
    const d = response();
    mutate(d);
    assert.throws(() => validarHistoricoCompra(d, 1));
  }
});
test('refresh clears old snapshot immediately and later requests win against out-of-order responses', async () => {
  const h = setup();
  await h.instance.consultar();
  let a, b;
  h.client.get = () =>
    new Promise((r) => {
      if (!a) a = r;
      else b = r;
    });
  const first = h.instance.consultar();
  await tick();
  assert.equal(h.state().dados, null);
  const second = h.instance.consultar();
  await tick();
  const updated = response();
  updated.dependenciasHistoricas.fontesHash = 'b'.repeat(64);
  b({ data: updated });
  await second;
  a({ data: response() });
  await first;
  assert.equal(
    h.state().dados.dependenciasHistoricas.fontesHash,
    'b'.repeat(64),
  );
  h.instance.dispose();
});
test('logout, background invalidation and disposal suppress late results and clear sensitive data', async () => {
  for (const action of ['revoke', 'invalidar', 'dispose']) {
    const h = setup();
    await h.instance.consultar();
    let finish;
    h.client.get = () =>
      new Promise((r) => {
        finish = r;
      });
    const pending = h.instance.consultar();
    await tick();
    if (action === 'revoke') h.revoke();
    else h.instance[action]();
    finish({ data: response() });
    await pending;
    assert.equal(h.state().dados, null);
    assert.notEqual(h.state().status, 'ready');
    h.instance.dispose();
  }
});
test('removed purchase, network errors and changed context never retain a previous history', async () => {
  for (const status of [404, 409, 500]) {
    const h = setup();
    await h.instance.consultar();
    h.client.get = async () => {
      throw { response: { status } };
    };
    await h.instance.consultar();
    assert.equal(h.state().dados, null);
    assert.equal(h.state().status, status === 500 ? 'error' : 'unavailable');
    h.instance.dispose();
  }
  const h = setup({
    get: async () => {
      const d = response();
      d.contextual.contextoRevisao = 2;
      d.dependenciasHistoricas.contextoRevisao = 2;
      return { data: d };
    },
  });
  await h.instance.consultar();
  assert.equal(h.state().status, 'conflict');
  h.instance.dispose();
});
const text = (n) =>
  n == null
    ? ''
    : typeof n === 'object'
      ? (n.props?.children ?? []).map(text).join('')
      : String(n);
function screen(data = response()) {
  let next = data,
    listener,
    requests = 0;
  const h = setup({
    get: async () => {
      requests++;
      return { data: next };
    },
  });
  const native = Object.fromEntries(
    ['View', 'Text', 'Pressable', 'ActivityIndicator'].map((k) => [k, k]),
  );
  native.StyleSheet = { create: (v) => v };
  native.AppState = {
    addEventListener: (event, fn) => {
      listener = fn;
      return {
        remove() {
          listener = null;
        },
      };
    },
  };
  const renderer = createRenderer({
    'react-native': native,
    '../../../api/client': { apiClient: h.client },
    '../../../api/tokenStorage': { tokenStorage: h.storage },
  });
  renderer.mount(
    renderer.load('src/components/PurchaseComponents/HistoricoConsumo/index.js')
      .default,
    { compraId: 1, revisao: 1 },
  );
  return {
    ...h,
    renderer,
    set: (d) => {
      next = d;
    },
    appState: (s) => listener(s),
    requests: () => requests,
    content: () =>
      renderer
        .nodes((n) => n.type === 'Text')
        .map(text)
        .join('\n'),
    press: (label) => {
      const n = renderer.nodes(
        (n) => n.type === 'Pressable' && text(n) === label,
      )[0];
      assert.ok(n, label);
      n.props.onPress();
    },
  };
}
test('Mobile presents historical evidence separately, period, count, partial coverage, refusals and registered recurrences', async () => {
  const h = screen();
  await h.renderer.flush();
  for (const phrase of [
    'Seu histórico disponível',
    'Compras anteriores registradas',
    'Compras registradas',
  ])
    assert.ok(h.content().includes(phrase), phrase);
  assert.ok(!h.content().includes('abril'));
  assert.ok(!h.content().includes('UTC'));
  h.press('Explorar histórico');
  await h.renderer.flush();
  for (const phrase of [
    'Seu histórico de consumo',
    '1 de 2 (50%)',
    'Sem resposta',
    'Recorrências cadastradas hoje: 1',
    'Reflexões do seu histórico',
  ])
    assert.ok(h.content().includes(phrase), phrase);
  assert.ok(!h.content().includes('abril'));
  h.press('Sobre os dados e limitações');
  await h.renderer.flush();
  assert.ok(h.content().includes('Consultado em'));
  assert.ok(h.content().includes('Busca solicitada: 1º de abril'));
  h.renderer.unmount();
});
test('insufficient history is explicit and does not display reflections or an invented median', async () => {
  const d = response();
  d.reflexoesHistoricas = {
    ...d.reflexoesHistoricas,
    estado: 'DADOS_INSUFICIENTES',
    itens: [],
  };
  d.comparacaoValorCompra.amostra = 1;
  d.comparacaoValorCompra.medianaHistoricaCentavos = null;
  d.historico.qualidade.comprasAtual = 0;
  d.historico.qualidade.comprasHistorico = 1;
  const h = screen(d);
  await h.renderer.flush();
  assert.ok(h.content().includes('Estamos conhecendo seus hábitos'));
  assert.equal(
    h.renderer.nodes((n) =>
      n.props.accessibilityLabel?.includes('compras registradas'),
    ).length,
    0,
  );
  h.press('Explorar histórico');
  await h.renderer.flush();
  assert.ok(h.content().includes('Mais registros podem ajudar'));
  h.renderer.unmount();
});
test('foreground and explicit refresh query fresh records; background hides historical observations', async () => {
  const h = screen();
  await h.renderer.flush();
  h.appState('background');
  await h.renderer.flush();
  assert.ok(!h.content().includes('Compras registradas'));
  h.appState('active');
  await h.renderer.flush();
  assert.equal(h.requests(), 2);
  const updated = response();
  updated.historico.recorrencias.cadastradas = 3;
  h.set(updated);
  const button = h.renderer.nodes(
    (n) => n.type === 'Pressable' && text(n) === 'Atualizar histórico',
  )[0];
  button.props.onPress();
  await h.renderer.flush();
  h.press('Explorar histórico');
  await h.renderer.flush();
  assert.ok(h.content().includes('Recorrências cadastradas hoje: 3'));
  h.renderer.unmount();
});
test('changing purchase with same revision cannot expose the previous period while new consultation loads', async () => {
  const h = screen();
  await h.renderer.flush();
  h.client.get = () => new Promise(() => {});
  h.renderer.mount(
    h.renderer.load(
      'src/components/PurchaseComponents/HistoricoConsumo/index.js',
    ).default,
    { compraId: 2, revisao: 1 },
  );
  await h.renderer.flush();
  assert.ok(!h.content().includes('1º de abril de 2026'));
  h.renderer.unmount();
});

test('a purchase from another period displays only the newly returned historical window', async () => {
  const h = screen();
  await h.renderer.flush();
  const d = response();
  d.compraId = 2;
  d.contextual.compraId = 2;
  d.historico.periodo = '2026-09';
  d.historico.janelaHistorico.inicio = '2026-03-01T00:00:00.000Z';
  d.historico.observadoAte = '2026-09-05T00:00:00.000Z';
  Object.assign(d.dependenciasHistoricas, {
    periodo: '2026-09',
    inicio: d.historico.janelaHistorico.inicio,
    fimExclusivo: d.historico.observadoAte,
  });
  h.set(d);
  h.renderer.update({ compraId: 2, revisao: 1 });
  await h.renderer.flush();
  assert.ok(!h.content().includes('março'));
  h.press('Explorar histórico');
  await h.renderer.flush();
  h.press('Sobre os dados e limitações');
  await h.renderer.flush();
  assert.ok(h.content().includes('Busca solicitada: 1º de março de 2026'));
  assert.ok(h.content().includes('4 de setembro de 2026'));
  assert.ok(!h.content().includes('1º de abril de 2026'));
  h.renderer.unmount();
});

test('historical months and evidence topics are interactive and never exposed as a long initial report', async () => {
  const h = screen();
  await h.renderer.flush();
  assert.equal(
    h.renderer.nodes(
      (n) => n.type === 'Text' && text(n) === 'O que você contou',
    ).length,
    0,
  );
  h.press('Explorar histórico');
  await h.renderer.flush();
  h.press('setembro de 2026');
  await h.renderer.flush();
  assert.ok(h.content().includes('Planejamento informado'));
  assert.ok(h.content().includes('1º a 30 de setembro de 2026'));
  h.press('Valores');
  await h.renderer.flush();
  assert.ok(
    h
      .content()
      .includes(
        'O valor desta compra corresponde ao que você pretendia gastar?',
      ),
  );
  h.press('Valores');
  await h.renderer.flush();
  assert.ok(
    !h
      .content()
      .includes(
        'O valor desta compra corresponde ao que você pretendia gastar?',
      ),
  );
  h.renderer.unmount();
});
