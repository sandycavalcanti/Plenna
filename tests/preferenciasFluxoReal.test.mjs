import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';

const catalog = [
  { categoria_id: 1, categoria_nome: 'Roupas' },
  { categoria_id: 2, categoria_nome: 'Livros' },
  { categoria_id: 27, categoria_nome: ' Outros ' },
];
const modules = createRenderer();
const diagnostics = modules.load('src/utils/preferenciasDiagnostico.js');
const { calcularOrcamento, validarValorMonetario, MAX_VALOR_MONETARIO } = modules.load('src/utils/orcamento.js');
const { parseMoneyDraft } = modules.load('src/components/MoneyInput/money.js');

function flow({ editing = false, get, put, post, initialStep = 2 } = {}) {
  const reads = [], writes = [], logs = [];
  let parentProps;
  const apiClient = {
    async get(url) {
      reads.push(url);
      if (get) return { data: await get(url) };
      if (url === '/categories') return { data: catalog };
      if (url === '/users/user') return { data: { usuario_meta_valor_mensal: '963000.00', usuario_meta_valor_compra: '0.29' } };
      if (url === '/preferencia') return { data: [] };
      throw new Error('Unexpected read');
    },
    async put(url, payload) {
      writes.push({ url, payload });
      await put?.(url, payload);
    },
    async post(url) {
      writes.push({ url });
      await post?.(url);
      return { data: { token: 'mock-session' } };
    },
  };
  const r = createRenderer({
    '../../components/PreferencesForm': { __esModule: true, default: (props) => {
      parentProps = props;
      return r.React.createElement(Form, props);
    } },
    '../../api/client': { apiClient },
    '../../utils/preferenciasDiagnostico': {
      ...diagnostics,
      registrarFalhaPreferencias: (error, stage, mode) => logs.push(diagnostics.diagnosticarFalhaPreferencias(error, stage, mode)),
    },
  });
  const Form = r.load('src/components/PreferencesForm/index.js').default;
  const Screen = r.load(`src/pages/${editing ? 'EditPreferencesScreen' : 'SignUpScreen'}/index.js`).default;
  r.mount(Screen, { navigation: { navigate() {} }, route: { params: { completarOnboarding: initialStep === 2 } } });
  const button = () => r.nodes((n) => n.type === 'Button' && /^(Finalizar|Salvar Preferências|Salvando)/.test(n.props.title))[0]?.props;
  const input = (label) => r.nodes((n) => n.type === 'TextInput' && n.props.accessibilityLabel === label)[0]?.props;
  const budget = () => input('Limite mensal de gasto');
  const category = () => input('Limite mensal');
  const lock = () => r.nodes((n) => n.type === 'TouchableOpacity' && n.props.accessibilityLabel?.includes('orçamento mensal'))[0]?.props;
  async function change(label, text) {
    const p = input(label);
    p.onFocus(); p.onChangeText(text); p.onBlur();
    await r.flush();
  }
  async function add(index = 0) {
    r.nodes((n) => n.type === 'TouchableOpacity' && n.props.children.some((child) =>
      child?.type === 'Text' && child.props.children.includes('Adicionar limites por segmento +')))[0].props.onPress();
    const list = r.nodes((n) => n.type === 'FlatList')[0];
    await list.props.renderItem({ item: catalog[index] }).props.onPress();
    await r.flush();
  }
  return { r, reads, writes, logs, button, input, budget, category, lock, change, add, parent: () => parentProps };
}

test('legado: editar orçamento preserva metaValorCompra 200 e não escreve compras históricas', async () => {
  const user = { usuario_meta_valor_mensal: '1000.00', usuario_meta_valor_compra: '200.00' };
  const get = (url) => url === '/users/user' ? { ...user } : url === '/categories' ? catalog : [];
  const h = flow({ editing: true, get, put(url, payload) {
    assert.ok(['/users', '/preferencia/bulk'].includes(url));
    if (url === '/users') {
      user.usuario_meta_valor_mensal = String(payload.metaValorMensal);
      if (Object.hasOwn(payload, 'metaValorCompra')) user.usuario_meta_valor_compra = String(payload.metaValorCompra);
      assert.equal(Object.hasOwn(payload, 'valorAtencao'), false);
      assert.equal(Object.hasOwn(payload, 'valorMaximoCompra'), false);
    }
  } });
  await h.r.flush();
  assert.equal(h.input('Valor de atenção por compra').value.replace(/\s/g, ''), 'R$200,00');
  await h.change('Limite mensal de gasto', '500');
  await h.button().onPress();
  assert.equal(Object.hasOwn(h.writes[0].payload, 'metaValorCompra'), false);
  assert.equal(user.usuario_meta_valor_compra, '200.00');
  assert.equal(h.writes[0].payload.metaValorMensal, 500);
  assert.deepEqual(h.writes.map((write) => write.url), ['/users', '/preferencia/bulk']);
  h.r.unmount();
  const reopened = flow({ editing: true, get });
  await reopened.r.flush();
  assert.equal(reopened.input('Valor de atenção por compra').value.replace(/\s/g, ''), 'R$200,00');
  assert.deepEqual(reopened.writes, []);
});

for (const existing of [null, '0.00', '200.00', '200.29']) {
  test(`legado: abrir e salvar preserva valor preexistente ${existing}, sem migração`, async () => {
    const h = flow({ editing: true, get(url) {
      if (url === '/users/user') return { usuario_meta_valor_mensal: 1000, usuario_meta_valor_compra: existing };
      return url === '/categories' ? catalog : [];
    } });
    await h.r.flush();
    assert.deepEqual(h.writes, []);
    await h.button().onPress();
    const payload = h.writes[0].payload;
    assert.equal(Object.hasOwn(payload, 'metaValorCompra'), false);
    assert.deepEqual(h.writes.map((write) => write.url), ['/users', '/preferencia/bulk']);
  });
}

for (const text of ['', '0']) {
  test(`atenção ativa: editar para ${JSON.stringify(text)} orienta remoção explícita e impede confirmação ambígua`, async () => {
    const h = flow({ editing: true, get(url) {
      if (url === '/users/user') return { usuario_meta_valor_mensal: 1000, usuario_meta_valor_compra: '200.00' };
      return url === '/categories' ? catalog : [];
    } });
    await h.r.flush();
    await h.change('Valor de atenção por compra', text);
    await h.button().onPress();
    assert.deepEqual(h.writes, []);
    assert.ok(h.r.nodes((n) => n.props.accessibilityRole === 'alert').length > 0);
  });
}

for (const editing of [false, true]) {
  test(`${editing ? 'edição' : 'cadastro'}: atenção acima do mensal mantém contrato legado e não eleva orçamento`, async () => {
    const h = flow({ editing });
    await h.r.flush();
    await h.change('Limite mensal de gasto', '500');
    await h.change('Valor de atenção por compra', '800,29');
    await h.button().onPress();
    assert.equal(h.writes[0].payload.metaValorCompra, 800.29);
    assert.equal(h.writes[0].payload.metaValorMensal, 500);
    assert.deepEqual(h.writes[1].payload.preferencias, [{ categoriaId: 27, metaMensal: 500 }]);
    assert.deepEqual(h.logs, []);
  });
}

test('cadastro real carrega catálogo ao entrar na etapa, sem abrir modal, e salva Outros com ID real', async () => {
  const h = flow();
  assert.equal(h.button().disabled, true);
  await h.r.flush();
  assert.deepEqual(h.reads, ['/categories']);
  assert.equal(h.r.nodes((n) => n.type === 'Modal')[0].props.visible, false);
  assert.equal(h.button().disabled, false);
  await h.button().onPress();
  assert.deepEqual(h.writes.map((r) => r.url), ['/users', '/preferencia/bulk']);
  assert.deepEqual(h.writes[1].payload, { preferencias: [{ categoriaId: 27, metaMensal: 290 }] });
  assert.deepEqual(h.logs, []);
});

for (const editing of [false, true]) {
  const mode = editing ? 'edição' : 'cadastro';
  test(`${mode}: texto aberto supera escalas 10.000 e 963.000 e volta à referência`, async () => {
    const h = flow({ editing });
    await h.r.flush();
    await h.change('Limite mensal de gasto', '963000');
    await h.add();
    for (const value of ['12000', '963001,50', '1200000']) {
      await h.change('Limite mensal', value);
      assert.equal(h.r.nodes((n) => n.props.accessibilityRole === 'alert').length, 0);
      const native = h.r.nodes((n) => n.type === 'Slider')[1].props;
      const numeric = Number(value.replace(',', '.'));
      assert.equal(native.value, numeric);
      assert.ok(native.maximumValue >= numeric);
      assert.ok(native.maximumValue / native.step <= 1000);
    }
    await h.change('Limite mensal', '900000');
    await h.button().onPress();
    assert.equal(h.writes[0].payload.metaValorMensal, 963000);
    assert.deepEqual(h.writes[1].payload.preferencias, [
      { categoriaId: 1, metaMensal: 900000 }, { categoriaId: 27, metaMensal: 63000 },
    ]);
  });

  test(`${mode}: escala pequena não limita entrada aberta e conflito fechado permite reduzir`, async () => {
    const h = flow({ editing });
    await h.r.flush();
    await h.change('Limite mensal de gasto', '500');
    await h.add();
    await h.change('Limite mensal', '12000,50');
    assert.equal(h.r.nodes((n) => n.type === 'Slider')[1].props.value, 12000.5);
    await h.lock().onPress(); await h.r.flush();
    await h.change('Limite mensal de gasto', '200');
    await h.change('Limite mensal', '13000');
    assert.equal(h.r.nodes((n) => n.type === 'Slider')[1].props.value, 12000.5);
    await h.change('Limite mensal', '340,50');
    await h.button().onPress();
    assert.deepEqual(h.writes, []);
    await h.change('Limite mensal', '100');
    await h.button().onPress();
    assert.equal(h.writes[0].payload.metaValorMensal, 200);
    assert.equal(h.writes[1].payload.preferencias[0].metaMensal, 100);
  });

  for (const stage of ['USUARIO', 'PREFERENCIAS']) {
    for (const network of [false, true]) {
      test(`${mode}: falha ${network ? 'rede' : 'HTTP'} em ${stage} mantém etapa e aviso parcial`, async () => {
        const failingUrl = stage === 'USUARIO' ? '/users' : '/preferencia/bulk';
        const h = flow({ editing, put(url) {
          if (url === failingUrl) throw network
            ? { code: 'ERR_NETWORK', config: { headers: { authorization: 'secret' } } }
            : { response: { status: 500, data: 'sensitive' }, config: { data: 'private', headers: { authorization: 'secret' } } };
        } });
        await h.r.flush();
        await h.button().onPress(); await h.r.flush();
        assert.equal(h.writes.length, stage === 'USUARIO' ? 1 : 2);
        assert.deepEqual(h.logs.at(-1), {
          fluxo: editing ? 'EDICAO' : 'CADASTRO', etapa: stage, metodo: 'PUT', rota: failingUrl,
          ...(!network ? { status: 500 } : {}), codigo: network ? 'ERR_NETWORK' : 'ERRO_HTTP',
        });
        assert.equal(h.r.alerts.at(-1)[0], stage === 'USUARIO' ? 'Não foi possível concluir' : 'Salvamento incompleto');
        assert.equal(h.button().disabled, false);
      });
    }
  }

  test(`${mode}: precisão e capacidade inválidas não causam escrita`, async () => {
    const h = flow({ editing });
    await h.r.flush();
    for (const text of ['100000000', '99999999,991', '340,001']) {
      await h.change('Limite mensal de gasto', text);
      await h.button().onPress(); await h.r.flush();
      assert.deepEqual(h.writes, []);
      assert.equal(h.budget().value, text);
    }
    await h.change('Limite mensal de gasto', '99999999,99');
    await h.button().onPress();
    assert.equal(h.writes[0].payload.metaValorMensal, MAX_VALOR_MONETARIO);
  });
}

for (const badCatalog of [null, [], catalog.slice(0, 2), [...catalog, catalog[0]], [...catalog, { categoria_id: 28, categoria_nome: 'OUTROS' }], [{ categoria_id: '27', categoria_nome: 'Outros' }]]) {
  test(`cadastro: catálogo inválido ${JSON.stringify(badCatalog)} bloqueia e permite tentar novamente`, async () => {
    let current = badCatalog;
    const h = flow({ get: async () => current });
    await h.r.flush();
    assert.equal(h.button().disabled, true);
    await h.button().onPress();
    assert.deepEqual(h.writes, []);
    assert.equal(h.logs[0].codigo, 'CATALOGO_INVALIDO');
    current = catalog;
    await h.r.nodes((n) => n.type === 'Button' && n.props.title.includes('Tentar carregar'))[0].props.onPress();
    await h.r.flush();
    assert.equal(h.button().disabled, false);
    await h.button().onPress();
    assert.equal(h.writes.length, 2);
  });
}

test('catálogo indisponível e novas tentativas simultâneas compartilham uma leitura', async () => {
  let available = false, resolveRead;
  const h = flow({ get() {
    if (!available) throw { code: 'ERR_NETWORK' };
    return new Promise((resolve) => { resolveRead = resolve; });
  } });
  await h.r.flush();
  assert.deepEqual(h.logs[0], { fluxo: 'CADASTRO', etapa: 'CATALOGO', metodo: 'GET', rota: '/categories', codigo: 'ERR_NETWORK' });
  available = true;
  const retry = h.r.nodes((n) => n.type === 'Button' && n.props.title.includes('Tentar carregar'))[0].props.onPress;
  const first = retry(); const second = retry();
  assert.equal(h.reads.length, 2);
  resolveRead(catalog);
  await Promise.all([first, second]); await h.r.flush();
  await h.button().onPress();
  assert.equal(h.writes.length, 2);
});

test('seleção usa catálogo do pai sem leituras extras ao abrir modal', async () => {
  const h = flow(); await h.r.flush();
  await h.add(); await h.add(1);
  assert.deepEqual(h.reads, ['/categories']);
  await h.change('Limite mensal', '100');
  await h.button().onPress();
  assert.equal(h.writes[1].payload.preferencias[0].categoriaId, 1);
});

test('edição com valor carregado fora da capacidade falha localmente sem escrita', async () => {
  const h = flow({ editing: true, get(url) {
    if (url === '/users/user') return { usuario_meta_valor_mensal: 100000000 };
    if (url === '/categories') return catalog;
    return [];
  } });
  await h.r.flush(); await h.button().onPress();
  assert.deepEqual(h.writes, []);
  assert.deepEqual(h.logs, [{ fluxo: 'EDICAO', etapa: 'VALIDACAO', codigo: 'VALOR_MONETARIO_INVALIDO' }]);
});

test('edição com categoria desconhecida bloqueia carregamento e não sobrescreve preferências', async () => {
  const h = flow({ editing: true, get(url) {
    if (url === '/users/user') return { usuario_meta_valor_mensal: 2000 };
    if (url === '/categories') return catalog;
    return [{ categoria_id: 999, preferencia_meta: 100 }];
  } });
  await h.r.flush();
  assert.equal(h.button(), undefined);
  assert.deepEqual(h.writes, []);
  assert.equal(h.logs[0].codigo, 'CATALOGO_INVALIDO');
});

test('capacidade total e precisão são revalidadas antes da persistência, com soma em centavos', () => {
  assert.equal(validarValorMonetario(MAX_VALOR_MONETARIO), MAX_VALOR_MONETARIO);
  for (const value of [100000000, 1.001, -1, NaN, Infinity]) assert.throws(() => validarValorMonetario(value));
  for (const text of ['100000000', '1,001', '99999999,999']) assert.ok(parseMoneyDraft(text).error);
  assert.deepEqual(parseMoneyDraft('99999999,99'), { value: MAX_VALOR_MONETARIO });
  assert.throws(() => calcularOrcamento({ limiteMensal: 10, categorias: [
    { categoria_id: 1, limite: 99999999.99 }, { categoria_id: 2, limite: 0.01 },
  ] }), (e) => e.code === 'VALOR_MONETARIO_INVALIDO');
  const result = calcularOrcamento({ limiteMensal: 0.3, metaBloqueada: true, categorias: [
    { categoria_id: 1, limite: 0.1 }, { categoria_id: 2, limite: 0.2 },
  ] });
  assert.equal(result.somaCategorias, 0.3);
  assert.equal(result.sobraParaOutros, 0);
});

test('diagnóstico usa lista permitida e nunca inclui mensagens, configurações ou payloads', () => {
  const error = { message: 'password secret', code: 'TOKEN_SECRET', response: { status: 422, data: { email: 'private' } },
    config: { url: '/users?jwt=secret', headers: { authorization: 'Bearer secret' }, data: 'sensitive' } };
  assert.deepEqual(diagnostics.diagnosticarFalhaPreferencias(error, 'PREFERENCIAS', 'CADASTRO'), {
    fluxo: 'CADASTRO', etapa: 'PREFERENCIAS', metodo: 'PUT', rota: '/preferencia/bulk', status: 422, codigo: 'ERRO_HTTP',
  });
  const local = diagnostics.diagnosticarFalhaPreferencias(error, 'malicious secret', 'private');
  assert.deepEqual(local, { fluxo: 'EDICAO', etapa: 'VALIDACAO', codigo: 'VALIDACAO_LOCAL' });
  assert.doesNotMatch(JSON.stringify(local), /secret|sensitive|private|Bearer|password/);
  const records = [], original = console.error;
  try {
    console.error = (...args) => records.push(args);
    diagnostics.registrarFalhaPreferencias(error, 'USUARIO', 'CADASTRO');
  } finally { console.error = original; }
  assert.doesNotMatch(JSON.stringify(records), /secret|sensitive|private|Bearer|password/);
});

async function registerFirstStep(h) {
  for (const [placeholder, text] of [['Como devemos te chamar?', 'Teste'], ['E-mail', 'test@example.invalid'], ['Senha', 'test123'], ['Confirmação da senha', 'test123']]) {
    h.r.nodes((n) => n.type === 'CustomTextInput' && n.props.placeholder === placeholder)[0].props.onChangeText(text);
  }
  await h.r.flush();
  const terms = h.r.nodes((n) => n.type === 'TouchableOpacity' && n.props.children.some((child) =>
    child?.type === 'Text' && child.props.children.some((text) => typeof text === 'string' && text.includes('Li e concordo'))))[0];
  terms.props.onPress(); await h.r.flush();
  await h.r.nodes((n) => n.type === 'Button' && n.props.title === 'Cadastrar')[0].props.onPress();
  await h.r.flush();
}

test('cadastro completo desde a primeira etapa carrega catálogo uma vez e finaliza sem modal', async () => {
  const h = flow({ initialStep: 1 });
  assert.deepEqual(h.reads, []);
  await registerFirstStep(h);
  assert.deepEqual(h.writes.map((r) => r.url), ['/auth/register', '/auth/login']);
  assert.deepEqual(h.reads, ['/categories']);
  assert.equal(h.r.nodes((n) => n.type === 'Modal')[0].props.visible, false);
  await h.button().onPress();
  assert.deepEqual(h.writes.map((r) => r.url), ['/auth/register', '/auth/login', '/users', '/preferencia/bulk']);
});

for (const failingUrl of ['/auth/register', '/auth/login']) {
  test(`cadastro: falha simulada em ${failingUrl} identifica etapa sem iniciar preferências`, async () => {
    const h = flow({ initialStep: 1, post(url) { if (url === failingUrl) throw { response: { status: 503 } }; } });
    await registerFirstStep(h);
    assert.deepEqual(h.reads, []);
    assert.equal(h.button(), undefined);
    assert.deepEqual(h.logs[0], {
      fluxo: 'CADASTRO', etapa: failingUrl === '/auth/register' ? 'CADASTRO_USUARIO' : 'LOGIN',
      metodo: 'POST', rota: failingUrl, status: 503, codigo: 'ERRO_HTTP',
    });
  });
}

test('handler do cadastro valida catálogo antes de qualquer PUT mesmo se chamado fora do botão', async () => {
  let resolveRead;
  const h = flow({ get: () => new Promise((resolve) => { resolveRead = resolve; }) });
  await h.parent().onSalvar(false);
  assert.deepEqual(h.writes, []);
  assert.equal(h.logs[0].etapa, 'VALIDACAO');
  assert.equal(h.logs[0].codigo, 'CATALOGO_INVALIDO');
  resolveRead([]); await h.r.flush();
  await h.parent().onSalvar(false);
  assert.deepEqual(h.writes, []);
});

for (const route of ['/users/user', '/preferencia']) {
  test(`edição: falha ao ler ${route} bloqueia escrita e permite repetir carregamento`, async () => {
    let fail = true;
    const h = flow({ editing: true, get(url) {
      if (fail && url === route) throw { response: { status: 503 } };
      if (url === '/users/user') return { usuario_meta_valor_mensal: 2000 };
      if (url === '/categories') return catalog;
      return [];
    } });
    await h.r.flush();
    assert.equal(h.button(), undefined);
    assert.deepEqual(h.writes, []);
    assert.equal(h.logs[0].rota, route);
    fail = false;
    await h.r.nodes((n) => n.type === 'TouchableOpacity' && n.props.accessibilityRole === 'button')[0].props.onPress();
    await h.r.flush(); await h.button().onPress();
    assert.equal(h.writes.length, 2);
  });
}

test('soma acima da capacidade não é confirmada nem gravada, sem cortar o texto', async () => {
  const h = flow(); await h.r.flush();
  await h.add();
  await h.change('Limite mensal', '99999999,99');
  await h.add(1);
  const second = () => h.r.nodes((n) => n.type === 'TextInput' && n.props.accessibilityLabel === 'Limite mensal')[1].props;
  second().onFocus(); second().onChangeText('0,01'); second().onBlur();
  await h.r.flush(); await h.button().onPress(); await h.r.flush();
  assert.deepEqual(h.writes, []);
  assert.equal(second().value, '0,01');
  assert.equal(h.r.nodes((n) => n.type === 'Slider')[2].props.value, 0);
});

test('valor com precisão inválida carregado é preservado na exibição e bloqueado ao salvar', async () => {
  const h = flow({ editing: true, get(url) {
    if (url === '/users/user') return { usuario_meta_valor_mensal: 2000, usuario_meta_valor_compra: '1.001' };
    if (url === '/categories') return catalog;
    return [];
  } });
  await h.r.flush();
  assert.equal(h.input('Valor de atenção por compra').value, 'R$ 1,001');
  await h.button().onPress();
  assert.deepEqual(h.writes, []);
  assert.equal(h.logs[0].codigo, 'VALOR_MONETARIO_INVALIDO');
});

test('valores não numéricos carregados não são convertidos silenciosamente para zero', async () => {
  for (const invalidCategory of [false, true]) {
    const h = flow({ editing: true, get(url) {
      if (url === '/users/user') return { usuario_meta_valor_mensal: 2000, usuario_meta_valor_compra: invalidCategory ? 20 : 'invalid' };
      if (url === '/categories') return catalog;
      return invalidCategory ? [{ categoria_id: 1, preferencia_meta: 'invalid' }] : [];
    } });
    await h.r.flush();
    if (h.button()) await h.button().onPress();
    assert.deepEqual(h.writes, []);
    assert.equal(h.logs[0].codigo, 'VALOR_MONETARIO_INVALIDO');
  }
});
