import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';

// Os estilos reais permitem verificar alvos de toque e restrições de layout.
// Medição de texto, teclado e TalkBack ainda exigem dispositivo Android.
const stylesRenderer = createRenderer({
  'react-native': { StyleSheet: { create: (styles) => styles } },
});
const formStyles = stylesRenderer.load('src/components/PreferencesForm/styles.js').default;
const sliderStyles = stylesRenderer.load('src/components/LimitSlider/styles.js').styles;

function harness(editing) {
  const r = createRenderer({
    './styles': { __esModule: true, default: formStyles, styles: sliderStyles },
  });
  const Form = r.load('src/components/PreferencesForm/index.js').default;
  const saved = [], changes = [];
  let props = {
    isEditing: editing, quantidadeComprasMes: '8', onQuantidadeComprasChange() {},
    valorMaximoCompra: '', onValorMaximoCompraChange(value) {
      changes.push(['attention', value]); update({ valorMaximoCompra: value });
    },
    limiteGastoValor: 500, onLimiteGastoChange(value) {
      changes.push(['budget', value]); update({ limiteGastoValor: value });
    },
    limiteTempo: 60, onLimiteTempoChange() {},
    selectedCategories: [{ categoria_id: 1, categoria_nome: 'Roupas', limite: 200 }],
    categories: [{ categoria_id: 1, categoria_nome: 'Roupas' }, { categoria_id: 2, categoria_nome: 'Outros' }],
    obterSomaLimitesCategorias(items) {
      return items.filter((c) => c.categoria_nome !== 'Outros')
        .reduce((sum, c) => sum + Math.round(c.limite * 100), 0) / 100;
    },
    onAtualizarLimiteCategoria(id, value) {
      changes.push(['category', value]);
      update({ selectedCategories: props.selectedCategories.map((c) => c.categoria_id === id ? { ...c, limite: value } : c) });
    },
    onRemoverCategoria(id) {
      update({ selectedCategories: props.selectedCategories.filter((c) => c.categoria_id !== id) });
    },
    onAdicionarCategoria() {}, onSalvar(locked) { saved.push({ ...props, locked }); },
    onCancel() {},
  };
  function update(next) { props = { ...props, ...next }; r.update(props); }
  const text = (node) => (node?.props?.children || []).map((child) =>
    typeof child === 'object' ? text(child) : child ?? '').join('');
  const texts = () => r.nodes((n) => n.type === 'Text').map(text);
  const input = (label) => r.nodes((n) => n.type === 'TextInput' && n.props.accessibilityLabel === label)[0]?.props;
  const info = (title) => r.nodes((n) => n.props.accessibilityLabel === `Saiba mais: ${title}`)[0].props;
  const lock = () => r.nodes((n) => n.type === 'TouchableOpacity' &&
    /^(Bloquear|Desbloquear) orçamento mensal$/.test(n.props.accessibilityLabel))[0].props;
  const save = () => r.nodes((n) => n.type === 'Button' && /^(Finalizar|Salvar Preferências)$/.test(n.props.title))[0].props;
  const balance = () => r.nodes((n) => n.props.accessibilityLabel?.startsWith('Outros, saldo automático:'))[0].props.accessibilityLabel;
  async function edit(label, draft) {
    input(label).onFocus(); input(label).onChangeText(draft); input(label).onBlur();
    await r.flush();
  }
  r.mount(Form, props);
  return { r, saved, changes, update, texts, input, info, lock, save, balance, edit };
}

for (const editing of [false, true]) {
  const mode = editing ? 'edição' : 'cadastro';

  test(`${mode}: ajuda acessível sob demanda não modifica valores`, async () => {
    const h = harness(editing);
    assert.deepEqual(h.r.alerts, []);
    for (const title of ['Valor de atenção por compra', 'Cadeado do orçamento', 'Saldo de Outros']) {
      const button = h.info(title);
      assert.equal(button.accessibilityRole, 'button');
      assert.ok(button.accessibilityHint);
      assert.ok(button.style.minWidth >= 44 && button.style.minHeight >= 44);
      button.onPress();
      assert.equal(h.r.alerts.at(-1)[0], title);
      assert.equal(h.r.alerts.at(-1)[2][0].text, 'Entendi');
      assert.ok(!h.texts().includes(h.r.alerts.at(-1)[1]));
    }
    assert.deepEqual(h.changes, []);
    h.info('Cadeado do orçamento').onPress();
    assert.match(h.r.alerts.at(-1)[1], /Aberto:.*referência/);
    await h.lock().onPress(); await h.r.flush();
    h.info('Cadeado do orçamento').onPress();
    assert.match(h.r.alerts.at(-1)[1], /Fechado:.*preservados/);
    assert.ok(h.texts().includes('Orçamento fixo'));
    assert.ok(h.lock().style.minWidth >= 44 && h.lock().style.minHeight >= 44);
  });

  test(`${mode}: atenção opcional acima do orçamento orienta uma vez e permite salvar`, async () => {
    const h = harness(editing);
    await h.save().onPress();
    assert.equal(h.saved[0].valorMaximoCompra, '');
    await h.edit('Valor de atenção por compra', '800,50');
    assert.deepEqual(h.changes, [['attention', 800.5]]);
    assert.equal(h.texts().filter((t) => t.includes('Acima do orçamento mensal.')).length, 1);
    assert.equal(h.r.nodes((n) => n.props.accessibilityRole === 'alert').length, 0);
    await h.save().onPress();
    assert.equal(h.saved.at(-1).valorMaximoCompra, 800.5);
    assert.equal(h.saved.at(-1).limiteGastoValor, 500);
    await h.edit('Valor de atenção por compra', '0');
    assert.ok(!h.texts().some((t) => t.includes('Acima do orçamento mensal.')));
    await h.edit('Valor de atenção por compra', '');
    await h.save().onPress();
    assert.equal(h.saved.at(-1).valorMaximoCompra, '');
  });

  test(`${mode}: Outros é saldo somente de leitura e acompanha distribuição e remoção`, async () => {
    const h = harness(editing);
    const expected = (value) => `Outros, saldo automático: R$ ${value}`;
    assert.equal(h.balance(), expected('300,00'));
    assert.equal(h.r.nodes((n) => n.type === 'Slider').length, 2); // Tempo e Roupas.
    assert.equal(h.input('Outros'), undefined);
    h.update({ selectedCategories: [
      { categoria_id: 1, categoria_nome: 'Roupas', limite: 340.5 },
      { categoria_id: 2, categoria_nome: 'Outros', limite: 999 },
    ] });
    assert.equal(h.balance(), expected('159,50'));
    await h.r.nodes((n) => n.type === 'ProfileCard')[0].props.onRemove();
    await h.r.flush();
    assert.equal(h.balance(), expected('500,00'));
    assert.deepEqual(h.changes, []);
  });

  test(`${mode}: conflito mostra diferença exata, preserva categorias e aceita correção gradual`, async () => {
    const h = harness(editing);
    await h.lock().onPress(); await h.r.flush();
    await h.edit('Limite mensal de gasto', '100,50');
    assert.equal(h.input('Limite mensal').value.replace(/\s/g, ''), 'R$200,00');
    const notices = () => h.r.nodes((n) => n.props.accessibilityLiveRegion === 'polite');
    assert.equal(notices().length, 1);
    assert.match(h.texts().find((t) => t.startsWith('Redistribua ')), /R\$ 99,50/);
    assert.match(h.balance(), /R\$ 0,00$/);
    await h.save().onPress();
    assert.deepEqual(h.saved, []);
    assert.deepEqual(h.r.alerts, []);
    await h.edit('Limite mensal', '150,25');
    assert.match(h.texts().find((t) => t.startsWith('Redistribua ')), /R\$ 49,75/);
    await h.edit('Limite mensal', '100,50');
    assert.equal(notices().length, 0);
    await h.save().onPress();
    assert.equal(h.saved.length, 1);
    assert.deepEqual(h.changes, [['budget', 100.5], ['category', 150.25], ['category', 100.5]]);
  });

  test(`${mode}: campo monetário mantém foco visual, texto livre, erro e limite da API`, async () => {
    const h = harness(editing);
    const input = () => h.input('Valor de atenção por compra');
    assert.equal(input().keyboardType, 'decimal-pad');
    assert.equal(input().returnKeyType, 'done');
    assert.equal(input().autoCorrect, false);
    input().onFocus(); await h.r.flush();
    assert.ok(input().style.includes(formStyles.moneyInputFocused));
    for (const draft of ['', '0', '340', '340,', '340,50', '3040,50']) {
      input().onChangeText(draft); await h.r.flush();
      assert.equal(input().value, draft);
      assert.equal(input().selection, undefined);
      assert.deepEqual(h.changes, []);
    }
    input().onChangeText('100000000');
    await h.save().onPress(); await h.r.flush();
    assert.equal(h.saved.length, 0);
    assert.equal(input().value, '100000000');
    assert.equal(h.r.nodes((n) => n.props.accessibilityRole === 'alert').length, 1);
    input().onChangeText('340,001');
    await h.save().onPress(); await h.r.flush();
    assert.equal(h.saved.length, 0);
    await h.edit('Valor de atenção por compra', '99999999,99');
    await h.save().onPress();
    assert.equal(h.saved.at(-1).valorMaximoCompra, 99999999.99);
  });
}

test('layout monetário reserva uma linha inteira para valor e erro; tempo mantém layout anterior', () => {
  const h = harness(false);
  const rows = h.r.nodes((n) => Array.isArray(n.props.style) && n.props.style[0] === sliderStyles.row);
  assert.ok(!rows[0].props.style.includes(sliderStyles.moneyRow));
  assert.ok(rows[1].props.style.includes(sliderStyles.moneyRow));
  assert.equal(sliderStyles.moneyRow.flexDirection, 'column-reverse');
  assert.equal(sliderStyles.moneyRow.alignItems, 'stretch');
  assert.equal(formStyles.fieldLabelFlexible.flexShrink, 1);
  assert.equal(formStyles.actionsRow.flexWrap, 'wrap');
  assert.equal(formStyles.moneyInput.height, undefined); // Cresce com a fonte do sistema.
  assert.ok(formStyles.moneyInput.minHeight >= 44);
});
