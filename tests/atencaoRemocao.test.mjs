import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';

const catalog = [{ categoria_id: 1, categoria_nome: 'Roupas' }, { categoria_id: 2, categoria_nome: 'Outros' }];
function setup({ value = '200.00', store = { value }, put, profile = false } = {}) {
  const writes = [], reads = [], logs = [];
  const r = createRenderer({
    '@react-navigation/native': { useNavigation: () => ({ goBack() {}, navigate() {} }), useRoute: () => ({ params: { mode: 'info' } }) },
    '../../api/client': { apiClient: {
      async get(url) {
        reads.push(url);
        if (url === '/users/user') return { data: { usuario_nome: 'Teste', usuario_meta_valor_compra: store.value,
          usuario_meta_valor_mensal: 1000, usuario_meta_tempo: 60, usuario_limite_compra: 8 } };
        if (url === '/categories') return { data: catalog };
        if (url === '/goals') return { data: [] };
        if (url === '/preferencia') return { data: [{ categoria_id: 1, preferencia_meta: 200 }] };
        throw new Error('Unexpected read');
      },
      async put(url, payload) {
        writes.push({ url, payload: structuredClone(payload) });
        assert.ok(['/users', '/preferencia/bulk'].includes(url));
        if (put) return put(url, payload, store);
        if (Object.hasOwn(payload, 'metaValorCompra')) store.value = payload.metaValorCompra;
        return { data: { usuario_meta_valor_compra: store.value } };
      },
    } },
    '../../utils/preferenciasDiagnostico': {
      registrarFalhaPreferencias: (_error, stage, flow) => logs.push({ stage, flow }),
      mensagemValidacaoPreferencias: () => 'Confira os valores.',
    },
  });
  const Screen = r.load(`src/pages/${profile ? 'EditProfileScreen' : 'EditPreferencesScreen'}/index.js`).default;
  r.mount(Screen);
  const input = (label) => r.nodes((n) => n.type === 'TextInput' && n.props.accessibilityLabel === label)[0]?.props;
  const text = (node) => (node?.props?.children || []).map((c) => typeof c === 'object' ? text(c) : c ?? '').join('');
  const texts = () => r.nodes((n) => n.type === 'Text').map(text);
  const remove = () => r.nodes((n) => n.props.accessibilityLabel === 'Remover valor de atenção')[0]?.props;
  const save = () => r.nodes((n) => n.type === 'Button' && /Salvar|Salvando/.test(n.props.title))[0]?.props;
  function prompt() { remove().onPress(); return r.alerts.at(-1); }
  function confirm() { return prompt()[2].find((button) => button.text === 'Remover').onPress(); }
  async function edit(label, draft) { const p = input(label); p.onFocus(); p.onChangeText(draft); p.onBlur(); await r.flush(); }
  return { r, store, writes, reads, logs, input, texts, remove, save, prompt, confirm, edit };
}

test('remoção pede confirmação; cancelamento e descarte do diálogo não escrevem', async () => {
  const h = setup(); await h.r.flush();
  assert.equal(h.remove().accessibilityRole, 'button');
  assert.ok(h.remove().accessibilityHint);
  const prompt = h.prompt();
  assert.equal(prompt[0], 'Remover valor de atenção?');
  assert.deepEqual(h.writes, []);
  await h.save().onPress(); assert.deepEqual(h.writes, []);
  prompt[2].find((button) => button.text === 'Cancelar').onPress();
  await prompt[2].find((button) => button.text === 'Remover').onPress();
  assert.deepEqual(h.writes, []);
  h.prompt()[3].onDismiss();
  await h.save().onPress();
  assert.ok(h.writes.length > 0);
  assert.equal(Object.hasOwn(h.writes[0].payload, 'metaValorCompra'), false);
});

test('remoção envia somente null, confirma pela API e continua desativada em nova montagem', async () => {
  const h = setup(); await h.r.flush();
  await h.confirm(); await h.r.flush();
  assert.deepEqual(h.writes, [{ url: '/users', payload: { metaValorCompra: null } }]);
  assert.equal(h.remove(), undefined);
  assert.ok(h.texts().includes('Valor de atenção não definido'));
  assert.ok(h.texts().includes('Valor de atenção removido.'));
  assert.equal(h.input('Valor de atenção por compra').value, '');
  assert.equal(h.input('Limite mensal de gasto').value.replace(/\s/g, ''), 'R$1.000,00');
  h.r.unmount();
  const reopened = setup({ store: h.store }); await reopened.r.flush();
  assert.equal(reopened.remove(), undefined);
  assert.ok(reopened.texts().includes('Valor de atenção não definido'));
  await reopened.save().onPress();
  assert.equal(Object.hasOwn(reopened.writes[0].payload, 'metaValorCompra'), false);
  assert.equal(reopened.store.value, null);
});

test('remoção não confirma rascunhos financeiros, inclusive blur iniciado antes do toque', async () => {
  const h = setup(); await h.r.flush();
  h.input('Limite mensal de gasto').onFocus(); h.input('Limite mensal de gasto').onChangeText('340,');
  h.input('Limite mensal de gasto').onBlur();
  h.input('Limite mensal').onFocus(); h.input('Limite mensal').onChangeText('123,45');
  const promise = h.confirm();
  await promise; await h.r.flush();
  assert.equal(h.input('Limite mensal de gasto').value, '340,');
  assert.equal(h.input('Limite mensal').value, '123,45');
  assert.deepEqual(h.writes, [{ url: '/users', payload: { metaValorCompra: null } }]);
  assert.equal(h.r.nodes((n) => n.type === 'Slider')[1].props.value, 200);
  await h.edit('Limite mensal de gasto', '500');
  await h.save().onPress();
  assert.equal(h.writes[1].payload.metaValorMensal, 500);
  assert.equal(Object.hasOwn(h.writes[1].payload, 'metaValorCompra'), false);
  assert.equal(h.writes[2].payload.preferencias.find((c) => c.categoriaId === 1).metaMensal, 123.45);
});

test('remoção descarta somente o próprio rascunho incompleto e permite reativar com centavos', async () => {
  const h = setup(); await h.r.flush();
  h.input('Valor de atenção por compra').onFocus(); h.input('Valor de atenção por compra').onChangeText('340,');
  await h.confirm(); await h.r.flush();
  assert.equal(h.input('Valor de atenção por compra').value, '');
  await h.edit('Valor de atenção por compra', '340,50');
  await h.save().onPress(); await h.r.flush();
  assert.equal(h.writes[1].payload.metaValorCompra, 340.5);
  assert.equal(h.store.value, 340.5);
  assert.ok(h.remove());
  assert.ok(!h.texts().includes('Valor de atenção removido.'));
});

test('confirmações repetidas e salvar/slider/cadeado durante remoção não iniciam operações conflitantes', async () => {
  let release;
  const h = setup({ put: async (_url, payload, store) => {
    await new Promise((resolve) => { release = resolve; });
    store.value = payload.metaValorCompra;
    return { data: { usuario_meta_valor_compra: store.value } };
  } });
  await h.r.flush();
  const remove = h.remove(), save = h.save();
  const prompt = h.prompt(), action = prompt[2].find((button) => button.text === 'Remover');
  const pending = action.onPress();
  await h.r.flush();
  assert.equal(h.remove().disabled, true);
  assert.equal(h.save().disabled, true);
  assert.ok(!h.texts().includes('Valor de atenção removido.'));
  await action.onPress(); remove.onPress(); await save.onPress();
  const lock = h.r.nodes((n) => /^Bloquear orçamento/.test(n.props.accessibilityLabel))[0].props;
  await lock.onPress();
  await h.r.nodes((n) => n.type === 'Slider')[1].props.onValueChange(500);
  assert.equal(h.writes.length, 1);
  release(); await pending; await h.r.flush();
  assert.equal(h.r.nodes((n) => n.type === 'Slider')[1].props.value, 200);
  assert.ok(h.r.nodes((n) => /^Bloquear orçamento/.test(n.props.accessibilityLabel)).length);
});

for (const failure of ['network', 'missing-confirmation', 'response-lost']) {
  test(`falha ${failure}: sem sucesso falso ou reenvio posterior do valor antigo`, async () => {
    let failed = false;
    const h = setup({ put: async (_url, payload, store) => {
      if (!failed && payload.metaValorCompra === null) {
        failed = true;
        if (failure === 'response-lost') store.value = null;
        if (failure === 'missing-confirmation') return { data: {} };
        throw { code: 'ERR_NETWORK', config: { headers: { Authorization: 'private-fixture' } } };
      }
      if (Object.hasOwn(payload, 'metaValorCompra')) store.value = payload.metaValorCompra;
      return { data: { usuario_meta_valor_compra: store.value } };
    } });
    await h.r.flush();
    await h.edit('Valor de atenção por compra', '300');
    await h.confirm(); await h.r.flush();
    assert.ok(!h.texts().includes('Valor de atenção removido.'));
    assert.ok(!h.texts().includes('Valor de atenção não definido'));
    assert.equal(h.r.alerts.at(-1)[0], 'Remoção não confirmada');
    assert.deepEqual(h.logs, [{ stage: 'USUARIO', flow: 'EDICAO' }]);
    await h.save().onPress();
    assert.equal(Object.hasOwn(h.writes[1].payload, 'metaValorCompra'), false);
    assert.equal(h.store.value, failure === 'response-lost' ? null : '200.00');
  });
}

for (const value of [0, '0.00', null, '200.00']) {
  test(`valor legado ${value} não é reenviado ao salvar outras preferências`, async () => {
    const h = setup({ value }); await h.r.flush();
    await h.save().onPress();
    assert.equal(Object.hasOwn(h.writes[0].payload, 'metaValorCompra'), false);
    assert.equal(h.store.value, value);
    assert.equal(h.texts().includes('Valor de atenção não definido'), !(Number(value) > 0));
  });
}

test('tela antiga de edição de perfil não reativa um valor removido em outra tela', async () => {
  const h = setup({ profile: true }); await h.r.flush();
  h.store.value = null;
  await h.save().onPress();
  assert.equal(Object.hasOwn(h.writes[0].payload, 'metaValorCompra'), false);
  assert.equal(h.store.value, null);
});

test('outra tela de Preferências já aberta não reenvia o valor removido', async () => {
  const store = { value: '200.00' };
  const first = setup({ store }), stale = setup({ store });
  await first.r.flush(); await stale.r.flush();
  await first.confirm(); await first.r.flush();
  await stale.edit('Limite mensal de gasto', '500');
  await stale.save().onPress();
  assert.equal(Object.hasOwn(stale.writes[0].payload, 'metaValorCompra'), false);
  assert.equal(store.value, null);
});

test('salvamento geral em andamento impede abrir a remoção', async () => {
  let release;
  const h = setup({ put: async (_url, _payload, store) => {
    await new Promise((resolve) => { release = resolve; });
    return { data: { usuario_meta_valor_compra: store.value } };
  } });
  await h.r.flush();
  const remove = h.remove();
  const pending = h.save().onPress(); await h.r.flush();
  remove.onPress();
  assert.equal(h.r.alerts.length, 0);
  assert.equal(h.writes.length, 1);
  release(); await h.r.flush(); // Requisição de categorias do salvamento geral.
  release(); await pending;
  assert.equal(h.writes.length, 2);
  assert.ok(h.writes.every((write) => !Object.hasOwn(write.payload, 'metaValorCompra')));
});

test('confirmação de diálogo desmontado não inicia remoção', async () => {
  const h = setup(); await h.r.flush();
  const prompt = h.prompt(); h.r.unmount();
  await prompt[2].find((button) => button.text === 'Remover').onPress();
  assert.deepEqual(h.writes, []);
});

test('Perfil apresenta estado desativado para null/zero e valor positivo como atenção', () => {
  for (const value of [null, 0, '0.00', '200.00']) {
    const r = createRenderer();
    r.mount(r.load('src/components/BudgetPreferences/index.js').default, { gastoIdealMensal: 1000, gastoIdealCompra: value, preferencias: [] });
    const texts = r.nodes((n) => n.type === 'Text').flatMap((n) => n.props.children);
    assert.ok(texts.includes('Valor de atenção por compra'));
    assert.equal(texts.includes('Valor de atenção não definido'), !(Number(value) > 0));
    if (Number(value) > 0) assert.ok(texts.some((text) => typeof text === 'string' && text.includes('200,00')));
  }
});
