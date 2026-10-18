import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';

const utils = createRenderer().load('src/components/MoneyInput/money.js');

test('reais inteiros e decimais são convertidos somente em valores válidos', () => {
  for (const [text, value] of [['340', 340], ['340,50', 340.5], ['0', 0], ['000340', 340], ['0,29', 0.29], ['1.10', 1.1]]) {
    assert.deepEqual(utils.parseMoneyDraft(text), { value });
  }
  for (const text of ['340,', ',', '.', '1,234', '-10', '1e3', '1.000,00', 'abc', '999999999999999999999']) {
    assert.ok(utils.parseMoneyDraft(text).error, text);
  }
  assert.ok(utils.parseMoneyDraft('', { required: true }).error);
  assert.ok(utils.parseMoneyDraft('0', { required: true }).error);
  assert.deepEqual(utils.parseMoneyDraft(''), { value: 0 });
  assert.deepEqual(utils.parseMoneyDraft('', { emptyValue: '' }), { value: '' });
});

function inputHarness(props = {}) {
  const r = createRenderer();
  const Input = r.load('src/components/MoneyInput/index.js').default;
  const values = [];
  r.mount(Input, { value: 123, onConfirm: (v) => { values.push(v); }, ...props });
  const input = () => r.nodes((n) => n.type === 'TextInput')[0].props;
  return { r, values, input };
}

test('substituir e editar no meio mantém o texto e não publica valores por tecla', async () => {
  const { r, input, values } = inputHarness();
  input().onFocus();
  await r.flush();
  for (const text of ['', '3', '34', '340', '340,', '340,50', '3040,50']) {
    input().onChangeText(text);
    await r.flush();
    assert.equal(input().value, text);
    assert.deepEqual(values, []);
    assert.equal(input().selection, undefined);
  }
  input().onBlur();
  await r.flush();
  assert.deepEqual(values, [3040.5]);
});

test('apagar uma categoria confirma zero; orçamento vazio permanece inválido', async () => {
  for (const required of [false, true]) {
    const { r, input, values } = inputHarness({ required });
    input().onFocus(); input().onChangeText(''); input().onBlur();
    await r.flush();
    assert.deepEqual(values, required ? [] : [0]);
    if (required) {
      assert.equal(input().value, '');
      assert.equal(r.nodes((n) => n.props.accessibilityRole === 'alert').length, 1);
    }
  }
});

test('decimal incompleto não confirma e pode ser corrigido sem perder o texto', async () => {
  const { r, input, values } = inputHarness();
  input().onFocus(); input().onChangeText('340,'); input().onBlur();
  await r.flush();
  assert.equal(input().value, '340,');
  assert.deepEqual(values, []);
  input().onFocus(); input().onChangeText('340,50'); input().onSubmitEditing();
  await r.flush();
  assert.deepEqual(values, [340.5]);
});

test('foco sem alteração não substitui a referência por um aumento automático', async () => {
  const { r, input, values } = inputHarness({ value: 2100 });
  input().onFocus(); input().onBlur();
  await r.flush();
  assert.deepEqual(values, []);
});

test('atenção decimal não passa por remoção de ponto de centavos fracionários', async () => {
  for (const value of [0.29, 1.1]) {
    const { r, input, values } = inputHarness({ value });
    assert.equal(input().value.replace(/\s/g, ''), utils.formatMoney(value).replace(/\s/g, ''));
    input().onFocus();
    await r.flush();
    assert.equal(input().value, value.toFixed(2).replace('.', ','));
    input().onChangeText(input().value); input().onBlur();
    await r.flush();
    assert.deepEqual(values, [value]);
  }
});

function formHarness({ editing = true, onSave } = {}) {
  const r = createRenderer();
  const Form = r.load('src/components/PreferencesForm/index.js').default;
  const { React } = r;
  const saved = [];
  let state;
  function Parent() {
    const [budget, setBudget] = React.useState(2000);
    const reference = React.useRef(2000);
    const [attention, setAttention] = React.useState(0.29);
    const [categories, setCategories] = React.useState([{ categoria_id: 1, categoria_nome: 'Roupas', limite: 1900 }]);
    const [minutes, setMinutes] = React.useState(60);
    const sum = (items) => items.reduce((total, item) => total + item.limite, 0);
    state = { budget, reference: reference.current, attention, categories, minutes };
    return React.createElement(Form, {
      quantidadeComprasMes: '8', onQuantidadeComprasChange() {},
      valorMaximoCompra: attention, onValorMaximoCompraChange: setAttention,
      limiteGastoValor: budget,
      onLimiteGastoChange(value, locked) {
        reference.current = value;
        setBudget(locked ? value : Math.max(value, sum(categories)));
      },
      limiteTempo: minutes, onLimiteTempoChange: setMinutes,
      selectedCategories: categories, obterSomaLimitesCategorias: sum,
      categories: [...categories, { categoria_id: 14, categoria_nome: 'Outros' }],
      onAtualizarLimiteCategoria(id, value, locked) {
        const other = sum(categories.filter((c) => c.categoria_id !== id));
        const current = categories.find((c) => c.categoria_id === id).limite;
        const limit = locked && value > current ? Math.min(value, Math.max(current, budget - other)) : value;
        const next = categories.map((c) => c.categoria_id === id ? { ...c, limite: limit } : c);
        setCategories(next);
        if (!locked) setBudget(Math.max(reference.current, sum(next)));
      },
      onRemoverCategoria(id, locked) {
        const next = categories.filter((c) => c.categoria_id !== id);
        setCategories(next);
        if (!locked) setBudget(Math.max(reference.current, sum(next)));
      },
      onAdicionarCategoria() {},
      async onSalvar(locked) {
        saved.push({ budget, attention, categories, locked, minutes });
        await onSave?.();
      },
      isEditing: editing,
    });
  }
  r.mount(Parent);
  const input = (label) => r.nodes((n) => n.type === 'TextInput' && n.props.accessibilityLabel === label)[0].props;
  const budget = () => input('Limite mensal de gasto');
  const category = () => input('Limite mensal');
  const attention = () => input('Valor de atenção por compra');
  const save = () => r.nodes((n) => n.type === 'Button' && n.props.title !== 'Cancelar')[0].props;
  const lock = () => r.nodes((n) => n.type === 'TouchableOpacity' && n.props.accessibilityLabel?.includes('orçamento mensal'))[0].props;
  const slider = () => r.nodes((n) => n.type === 'Slider')[1].props;
  return { r, saved, state: () => state, budget, category, attention, save, lock, slider };
}

for (const editing of [true, false]) {
  test(`${editing ? 'edição' : 'cadastro'}: Salvar confirma o campo focado e usa callbacks do novo render`, async () => {
    const h = formHarness({ editing });
    h.budget().onFocus(); h.budget().onChangeText('2500');
    await h.r.flush();
    assert.equal(h.state().budget, 2000);
    await h.save().onPress();
    assert.equal(h.saved[0].budget, 2500);
    assert.equal(h.state().reference, 2500);
  });
}

test('cadeado confirma orçamento antes de alternar; redução em conflito não altera categorias', async () => {
  const h = formHarness();
  h.budget().onFocus(); h.budget().onChangeText('2200');
  await h.lock().onPress(); await h.r.flush();
  assert.equal(h.state().budget, 2200);
  assert.equal(h.lock().accessibilityLabel, 'Desbloquear orçamento mensal');
  assert.equal(h.lock().hitSlop, 8);
  h.budget().onFocus(); h.budget().onChangeText('1000');
  await h.save().onPress();
  assert.equal(h.state().budget, 1000);
  assert.equal(h.state().categories[0].limite, 1900);
  assert.equal(h.saved.length, 0);
  assert.equal(h.r.alerts.length, 0);
  assert.equal(h.r.nodes((n) => n.type === 'Text' &&
    n.props.accessibilityLiveRegion === 'polite' &&
    n.props.children.includes('Redistribua ')).length, 1);
  h.category().onFocus(); h.category().onChangeText('900');
  await h.save().onPress();
  assert.equal(h.saved[0].budget, 1000);
  assert.equal(h.saved[0].categories[0].limite, 900);
});

test('slider espera orçamento focado confirmar e usa o novo limite do cadeado', async () => {
  const h = formHarness();
  await h.lock().onPress(); await h.r.flush();
  h.budget().onFocus(); h.budget().onChangeText('3000');
  h.slider().onSlidingStart();
  await h.slider().onValueChange(2800); await h.r.flush();
  h.slider().onSlidingComplete();
  assert.equal(h.state().budget, 3000);
  assert.equal(h.state().categories[0].limite, 2800);
});

test('categoria focada confirma antes do slider e volta à referência ao reduzir', async () => {
  const h = formHarness();
  h.category().onFocus(); h.category().onChangeText('2100');
  h.slider().onSlidingStart();
  await h.slider().onValueChange(1900); await h.r.flush();
  h.slider().onSlidingComplete();
  assert.equal(h.state().reference, 2000);
  assert.equal(h.state().budget, 2000);
  assert.equal(h.state().categories[0].limite, 1900);
});

test('limite fechado rejeita aumento digitado com orientação e permite corrigir', async () => {
  const h = formHarness();
  await h.lock().onPress(); await h.r.flush();
  h.category().onFocus(); h.category().onChangeText('2100');
  await h.save().onPress(); await h.r.flush();
  assert.equal(h.saved.length, 0);
  assert.equal(h.state().categories[0].limite, 1900);
  assert.ok(h.r.nodes((n) => n.props.accessibilityRole === 'alert').length);
  assert.equal(h.category().value, '2100');
  h.category().onChangeText('340,50');
  await h.save().onPress();
  assert.equal(h.saved[0].categories[0].limite, 340.5);
  assert.equal(h.saved[0].budget, 2000);
});

test('orçamento vazio ou decimal incompleto impede cadeado, slider e salvamento', async () => {
  for (const text of ['', '340,']) {
    const h = formHarness();
    h.budget().onFocus(); h.budget().onChangeText(text);
    await h.lock().onPress(); await h.r.flush();
    await h.slider().onValueChange(300); await h.r.flush();
    await h.save().onPress(); await h.r.flush();
    assert.equal(h.saved.length, 0);
    assert.equal(h.state().budget, 2000);
    assert.equal(h.state().categories[0].limite, 1900);
    assert.equal(h.budget().value, text);
    assert.equal(h.lock().accessibilityLabel, 'Bloquear orçamento mensal');
  }
});

test('duplo toque não inicia salvamentos simultâneos e libera após finalizar', async () => {
  let release;
  const h = formHarness({ onSave: () => new Promise((resolve) => { release = resolve; }) });
  const first = h.save().onPress();
  const second = h.save().onPress();
  await h.r.flush();
  assert.equal(h.saved.length, 1);
  assert.equal(h.save().disabled, true);
  assert.equal(h.budget().editable, false);
  assert.equal(h.lock().disabled, true);
  release(); await Promise.all([first, second]); await h.r.flush();
  assert.equal(h.save().disabled, false);
});

test('tempo mantém unidades e edição anteriores; slider confirma atenção monetária antes', async () => {
  const h = formHarness();
  h.attention().onFocus(); h.attention().onChangeText('1,10');
  const time = () => h.r.nodes((n) => n.type === 'Slider')[0].props;
  time().onSlidingStart();
  await time().onValueChange(90); await h.r.flush();
  time().onSlidingComplete();
  assert.equal(h.state().attention, 1.1);
  assert.equal(h.state().minutes, 90);
  assert.equal(time().value, 90);
  assert.equal(time().step, 10);
  assert.equal(time().maximumValue, 360);
});

test('cancelar desmontagem durante confirmação não salva nem deixa promessa pendente', async () => {
  const h = formHarness();
  const saving = h.save().onPress();
  h.r.unmount();
  await saving;
  assert.equal(h.saved.length, 0);
});

test('blur e Salvar no mesmo evento confirmam uma vez e persistem o último valor', async () => {
  const h = formHarness();
  h.attention().onFocus(); h.attention().onChangeText('340,50');
  h.attention().onBlur();
  await h.save().onPress();
  assert.equal(h.saved.length, 1);
  assert.equal(h.saved[0].attention, 340.5);
});

test('foco no orçamento aumentado automaticamente não troca referência original', async () => {
  const h = formHarness();
  h.category().onFocus(); h.category().onChangeText('2100'); h.category().onBlur();
  await h.r.flush();
  assert.equal(h.state().budget, 2100);
  h.budget().onFocus(); h.budget().onBlur();
  await h.r.flush();
  h.category().onFocus(); h.category().onChangeText('1900');
  await h.save().onPress();
  assert.equal(h.state().reference, 2000);
  assert.equal(h.saved[0].budget, 2000);
});

test('categoria zero atualiza inclusive o valor do controle nativo', async () => {
  const h = formHarness();
  h.category().onFocus(); h.category().onChangeText('');
  await h.save().onPress();
  assert.equal(h.saved[0].categories[0].limite, 0);
  assert.equal(h.state().budget, 2000);
  const slider = h.r.nodes((n) => n.type === 'Slider')[1];
  assert.equal(slider.props.value, 0);
  assert.equal(slider.nativeProps.value, 0);
});

test('slider rejeitado por edição incompleta retorna à posição financeira confirmada', async () => {
  const h = formHarness();
  h.budget().onFocus(); h.budget().onChangeText('');
  await h.slider().onValueChange(700); await h.r.flush();
  const slider = h.r.nodes((n) => n.type === 'Slider')[1];
  assert.equal(slider.nativeProps.value, 1900);
  assert.equal(h.state().categories[0].limite, 1900);
});

test('remoção confirma edição pendente e calcula saldo com categorias atuais', async () => {
  const h = formHarness();
  h.category().onFocus(); h.category().onChangeText('2100');
  const card = h.r.nodes((n) => n.type === 'ProfileCard')[0];
  await card.props.onRemove(); await h.r.flush();
  assert.deepEqual(h.state().categories, []);
  assert.equal(h.state().budget, 2000);
});

test('sliders e demais consumidores sem opção de edição monetária preservam comportamento', async () => {
  const r = createRenderer();
  const Slider = r.load('src/components/LimitSlider/index.js').default;
  const values = [];
  r.mount(Slider, { horas: true, initialValue: 60, max: 360, onValueChange: (v) => values.push(v) });
  const input = () => r.nodes((n) => n.type === 'TextInput')[0].props;
  input().onFocus(); await r.flush();
  input().onChangeText('130'); await r.flush();
  assert.equal(values.at(-1), 90);
  assert.equal(input().value, '1h30');
  input().onBlur(); await r.flush();
  assert.equal(input().value, '1h30');
  assert.equal(r.nodes((n) => n.type === 'Slider')[0].props.value, 90);
});

test('erro no salvamento libera proteção contra duplo toque e edição', async () => {
  const h = formHarness({ onSave: () => { throw new Error('offline'); } });
  await assert.rejects(h.save().onPress(), /offline/);
  await h.r.flush();
  assert.equal(h.save().disabled, false);
  assert.equal(h.budget().editable, true);
  assert.equal(h.lock().disabled, false);
});

test('trocar de campo não confirma nem reformata o novo campo sem digitação', async () => {
  const h = formHarness();
  h.attention().onFocus(); h.attention().onChangeText('340');
  h.attention().onBlur();
  h.budget().onFocus();
  await h.r.flush();
  assert.equal(h.state().attention, 340);
  assert.equal(h.budget().value, '2000,00');
  h.budget().onChangeText('2500');
  await h.save().onPress();
  assert.equal(h.saved[0].budget, 2500);
});
