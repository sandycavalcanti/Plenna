import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';

function createForm({ editing, budget = 600, limits = [200, 100] }) {
  const r = createRenderer();
  const Form = r.load('src/components/PreferencesForm/index.js').default;
  const { categoriaEhOutros } = r.load('src/utils/categorias.js');
  const changes = [];
  const categories = limits.map((limite, i) => ({ categoria_id: i + 1, categoria_nome: `Categoria ${i + 1}`, limite }));
  let props = {
    isEditing: editing, quantidadeComprasMes: '8', onQuantidadeComprasChange() {},
    valorMaximoCompra: 0.29, onValorMaximoCompraChange() {},
    limiteGastoValor: budget, onLimiteGastoChange() {},
    limiteTempo: 60, onLimiteTempoChange() {},
    selectedCategories: categories,
    categories: [...categories, { categoria_id: 14, categoria_nome: 'Outros' }],
    obterSomaLimitesCategorias(items) {
      return items.filter((c) => !categoriaEhOutros(c)).reduce((sum, c) => sum + c.limite, 0);
    },
    onAtualizarLimiteCategoria(id, value, locked) {
      changes.push({ id, value, locked });
      update({ selectedCategories: props.selectedCategories.map((c) => c.categoria_id === id ? { ...c, limite: value } : c) });
    },
    onAdicionarCategoria() {}, onRemoverCategoria() {}, onSalvar() {},
  };
  function update(next) { props = { ...props, ...next }; r.update(props); }
  const sliders = () => r.nodes((n) => n.type === 'Slider');
  const slider = (index = 0) => sliders()[index + 1];
  const input = (index = 0) => r.nodes((n) => n.type === 'TextInput' && n.props.accessibilityLabel === 'Limite mensal')[index].props;
  const lock = () => r.nodes((n) => n.type === 'TouchableOpacity' && n.props.accessibilityLabel?.includes('orçamento mensal'))[0].props.onPress();
  r.mount(Form, props);
  return { r, changes, update, sliders, slider, input, lock };
}

function assertScale(h, index, max, value) {
  const p = h.slider(index).props;
  assert.equal(p.minimumValue, 0);
  assert.equal(p.maximumValue, max);
  assert.equal(p.upperLimit, max);
  assert.equal(p.value, value);
  assert.ok(p.value <= p.maximumValue);
}

for (const editing of [false, true]) {
  const mode = editing ? 'edição' : 'cadastro';

  test(`${mode}: escala proporcional ao saldo próprio no orçamento parcialmente distribuído`, async () => {
    const h = createForm({ editing });
    await h.lock(); await h.r.flush();
    assertScale(h, 0, 500, 200);
    assertScale(h, 1, 400, 100);
    assert.equal(h.slider().props.value / h.slider().props.maximumValue, 0.4);
    assert.deepEqual(h.changes, []);
    await h.slider().props.onValueChange(900); await h.r.flush();
    assert.deepEqual(h.changes.at(-1), { id: 1, value: 500, locked: true });
    assertScale(h, 0, 500, 500);
    assertScale(h, 1, 100, 100);
  });

  test(`${mode}: orçamento totalmente distribuído termina no valor atual de cada categoria`, async () => {
    const h = createForm({ editing, limits: [200, 400, 0] });
    await h.lock(); await h.r.flush();
    assertScale(h, 0, 200, 200);
    assertScale(h, 1, 400, 400);
    assertScale(h, 2, 0, 0);
    assert.equal(h.slider(2).props.disabled, true);
    assert.equal(h.input(2).editable, true);
    assert.equal(h.sliders()[0].props.disabled, false);
    await h.slider().props.onValueChange(150); await h.r.flush();
    assertScale(h, 0, 200, 150);
    assertScale(h, 1, 450, 400);
    assertScale(h, 2, 50, 0);
    assert.equal(h.slider(2).props.disabled, false);
  });

  test(`${mode}: conflito preserva valores existentes e só permite reduções graduais`, async () => {
    const h = createForm({ editing, limits: [200, 500] });
    await h.lock(); await h.r.flush();
    assertScale(h, 0, 200, 200);
    assertScale(h, 1, 500, 500);
    assert.deepEqual(h.changes, []);
    await h.slider().props.onValueChange(300); await h.r.flush();
    assert.equal(h.changes.at(-1).value, 200);
    await h.slider().props.onValueChange(150); await h.r.flush();
    assertScale(h, 0, 150, 150);
    assertScale(h, 1, 500, 500);
    await h.slider().props.onValueChange(100); await h.r.flush();
    assertScale(h, 0, 100, 100);
    await h.slider().props.onValueChange(50); await h.r.flush();
    assertScale(h, 0, 100, 50);
    assertScale(h, 1, 550, 500);
  });

  test(`${mode}: outras categorias acima do teto não impedem reduzir até zero`, async () => {
    const h = createForm({ editing, limits: [200, 700] });
    await h.lock(); await h.r.flush();
    assertScale(h, 0, 200, 200);
    h.input().onFocus(); h.input().onChangeText('150'); h.input().onBlur();
    await h.r.flush();
    assertScale(h, 0, 150, 150);
    h.input().onFocus(); h.input().onChangeText(''); h.input().onBlur();
    await h.r.flush();
    assertScale(h, 0, 0, 0);
    assert.equal(h.slider().props.disabled, true);
    assert.equal(h.changes.at(-1).value, 0);
    h.input().onFocus(); h.input().onChangeText('1'); h.input().onBlur();
    await h.r.flush();
    assert.equal(h.changes.at(-1).value, 0);
    assert.ok(h.r.nodes((n) => n.props.accessibilityRole === 'alert').length);
  });

  test(`${mode}: diminuir máximo por orçamento ou distribuição não normaliza o valor existente`, async () => {
    const h = createForm({ editing, budget: 1000, limits: [340.5, 100] });
    await h.lock(); await h.r.flush();
    assertScale(h, 0, 900, 340.5);
    h.update({ limiteGastoValor: 200 });
    await h.r.flush();
    assertScale(h, 0, 340.5, 340.5);
    assert.equal(h.slider().nativeProps.value, 340.5);
    assert.deepEqual(h.changes, []);
    h.update({ limiteGastoValor: 600 });
    await h.r.flush();
    assertScale(h, 0, 500, 340.5);
    h.update({ selectedCategories: [
      { categoria_id: 1, categoria_nome: 'Categoria 1', limite: 340.5 },
      { categoria_id: 2, categoria_nome: 'Categoria 2', limite: 400 },
    ] });
    await h.r.flush();
    assertScale(h, 0, 340.5, 340.5);
    assert.deepEqual(h.changes, []);
  });

  test(`${mode}: limite abaixo do antigo passo preserva confirmação decimal e zero`, async () => {
    const h = createForm({ editing, budget: 1, limits: [0.25, 0.5] });
    await h.lock(); await h.r.flush();
    assertScale(h, 0, 0.5, 0.25);
    assert.equal(h.slider().props.step, 0.01);
    h.input().onFocus(); h.input().onChangeText('0,40');
    await h.r.flush();
    assert.deepEqual(h.changes, []);
    h.input().onBlur(); await h.r.flush();
    assertScale(h, 0, 0.5, 0.4);
    h.input().onFocus(); h.input().onChangeText('0'); h.input().onBlur();
    await h.r.flush();
    assertScale(h, 0, 0.5, 0);
    await h.slider().props.onValueChange(0.28999999); await h.r.flush();
    assertScale(h, 0, 0.5, 0.29);
  });

  test(`${mode}: cadeado aberto mantém escala anterior e alternância não muda finanças ou tempo`, async () => {
    const h = createForm({ editing });
    const time = { ...h.sliders()[0].props };
    assert.equal(h.slider().props.maximumValue, 10000);
    await h.lock(); await h.r.flush();
    assertScale(h, 0, 500, 200);
    await h.lock(); await h.r.flush();
    assert.equal(h.slider().props.maximumValue, 10000);
    assert.equal(h.slider().props.value, 200);
    assert.deepEqual(h.changes, []);
    for (const prop of ['minimumValue', 'maximumValue', 'upperLimit', 'value', 'step', 'disabled']) {
      assert.equal(h.sliders()[0].props[prop], time[prop], prop);
    }
  });

  test(`${mode}: saldo Outros não reduz o máximo das categorias específicas`, async () => {
    const h = createForm({ editing, limits: [200] });
    h.update({ selectedCategories: [
      { categoria_id: 1, categoria_nome: 'Roupas', limite: 200 },
      { categoria_id: 14, categoria_nome: 'Outros', limite: 400 },
    ] });
    await h.lock(); await h.r.flush();
    assertScale(h, 0, 600, 200);
    assert.equal(h.sliders().length, 2);
  });
}
