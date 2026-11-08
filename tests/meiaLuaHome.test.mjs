import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformSync } from '@babel/core';

const base = new URL('../', import.meta.url);
const helper = await readFile(new URL('src/utils/meiaLuaHome.js', base), 'utf8');
const { apresentarMeiaLua, CORES_ORCAMENTO } = await import('data:text/javascript;base64,' + Buffer.from(helper).toString('base64'));
const data = (percent, state) => ({
  financeiro: { qualidade: 'COMPLETO', cobertura: 'COMPLETA', comprasSemValor: 0, totalConhecidoCentavos: percent * 200 },
  orcamento: { disponibilidade: 'REFERENCIA_ATUAL', valorCentavos: 20000, percentualConhecido: percent, estadoUtilizacao: state, excessoConhecidoCentavos: percent > 100 ? (percent - 100) * 200 : 0 },
});

const source = await readFile(new URL('src/components/HomeComponents/CardFinanceiroHome.js', base), 'utf8');
const moneySource = await readFile(new URL('src/utils/metaMoney.js', base), 'utf8');
const { valorRealParaCentavos } = await import('data:text/javascript;base64,' + Buffer.from(moneySource).toString('base64'));
const code = transformSync(source.replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'] }).code;
let expanded = false;
const React = { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) };
const render = new Function('React', 'View', 'Text', 'Pressable', 'ActivityIndicator', 'StyleSheet', 'Svg', 'Path', 'MaterialCommunityIcons', 'useState', 'apresentarMeiaLua', 'CORES_ORCAMENTO', 'valorRealParaCentavos', `${code};return CardFinanceiroHome;`)(React, 'View', 'Text', 'Pressable', 'Spinner', { create: (x) => x }, 'Svg', 'Path', 'Icon', (initial) => [expanded, (value) => { expanded = value; }], apresentarMeiaLua, CORES_ORCAMENTO, valorRealParaCentavos);
const nodes = (value) => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.children)] : [];
const text = (value) => Array.isArray(value) ? value.map(text).join(' ') : value && typeof value === 'object' ? text(value.children) : value == null || value === false ? '' : String(value);

for (const [percent, state, color] of [[0, 'VERDE', '#267344'], [16.6, 'VERDE', '#267344'], [49, 'VERDE', '#267344'], [50, 'AMARELO', '#926500'], [74, 'AMARELO', '#926500'], [75, 'LARANJA', '#A64C14'], [100, 'LARANJA', '#A64C14'], [115, 'VERMELHO', '#B32646']]) {
  test(`semicircle ${String(percent).replace('.', ',')}%`, () => {
    const d = data(percent, state);
    const tree = render({ dados: d });
    const chart = apresentarMeiaLua(d);
    assert.equal(chart.progresso, Math.min(1, percent / 100));
    assert.equal(chart.cor, color);
    const paths = nodes(tree).filter((node) => node.type === 'Path');
    assert.equal(paths[0].props.d, 'M 20 120 A 100 100 0 0 1 220 120');
    assert.equal(paths.length, percent === 0 ? 1 : 2);
    if (percent > 0) {
      assert.equal(paths[1].props.stroke, color);
      assert.ok(Math.abs(paths[1].props.strokeDashoffset - Math.PI * 100 * (1 - Math.min(1, percent / 100))) < 1e-8);
    }
    assert.equal((text(tree).match(new RegExp(String(percent).replace('.', ','), 'g')) || []).length >= 1, true);
  });
}

test('exporta as cores do indicador e rejeita orçamento histórico não comprovado', () => {
  assert.equal(CORES_ORCAMENTO.NEUTRO, '#76658A');
  for (const budget of [
    { disponibilidade: 'INDISPONIVEL', motivo: 'ORCAMENTO_HISTORICO_NAO_COMPROVADO' },
    { disponibilidade: 'REFERENCIA_ATUAL', valorCentavos: 0 },
    { disponibilidade: 'REFERENCIA_ATUAL', valorCentavos: -1 },
  ]) {
    const original = data(115, 'VERMELHO');
    const d = { ...original, orcamento: { ...original.orcamento, ...budget } };
    const chart = apresentarMeiaLua(d);
    assert.equal(chart.percentual, null);
    assert.equal(chart.excesso, null);
    assert.equal(chart.estado, 'NEUTRO');
  }
  const invalid = data(0, 'NEUTRO');
  invalid.financeiro.qualidade = 'INSUFICIENTE';
  assert.equal(apresentarMeiaLua(invalid).compras, null);
});

for (const qualidade of ['COMPLETO', 'PARCIAL']) for (const cobertura of ['COMPLETA', 'PARCIAL', 'DESCONHECIDA']) test(`faixas com valores conhecidos: ${qualidade}/${cobertura}`, () => {
  for (const [percent, expected] of [[0, 'VERDE'], [49.99, 'VERDE'], [50, 'AMARELO'], [74.99, 'AMARELO'], [75, 'LARANJA'], [100, 'LARANJA'], [100.01, 'VERMELHO']]) {
    const d = data(percent, 'NEUTRO');
    Object.assign(d.financeiro, { qualidade, cobertura, comprasSemValor: qualidade === 'PARCIAL' ? 1 : 0 });
    const chart = apresentarMeiaLua(d);
    const conservative = qualidade === 'PARCIAL' || cobertura !== 'COMPLETA';
    const expectedState = conservative ? (percent > 100 ? 'VERMELHO' : 'NEUTRO') : expected;
    const expectedColor = { VERDE: '#267344', AMARELO: '#926500', LARANJA: '#A64C14', VERMELHO: '#B32646', NEUTRO: '#76658A' }[expectedState];
    assert.equal(chart.estado, expectedState);
    assert.equal(chart.cor, expectedColor);
    assert.equal(chart.percentual, percent);
    assert.doesNotMatch(text(render({ dados: d })), /Dentro do orçamento/);
    if (conservative && percent <= 100) assert.match(text(render({ dados: d })), /Dados parciais/);
  }
});

test('orçamento fixo da Home conserva a ressalva de cobertura parcial', () => {
  const d = data(49, 'NEUTRO');
  d.financeiro.cobertura = 'DESCONHECIDA';
  const chart = apresentarMeiaLua(d, 20000);
  assert.equal(chart.estado, 'NEUTRO');
  assert.equal(chart.percentual, 49);
  const above = data(115, 'VERMELHO');
  above.financeiro.qualidade = 'PARCIAL';
  above.financeiro.comprasSemValor = 1;
  const fixedAbove = apresentarMeiaLua(data(212.5, 'VERMELHO'), 40000);
  assert.equal(fixedAbove.estado, 'VERMELHO');
  assert.equal(fixedAbove.cor, CORES_ORCAMENTO.VERMELHO);
  assert.match(text(render({ dados: above })), /Excesso conhecido/);
  assert.match(text(render({ dados: above })), /Total conhecido acima do orçamento/);
  assert.match(text(render({ dados: above })), /115%/);
});

test('dados desconhecidos ocultam o arco e não inventam utilização', () => {
  const unknown = data(50, 'AMARELO');
  unknown.financeiro.qualidade = 'INSUFICIENTE';
  const tree = render({ dados: unknown });
  assert.equal(nodes(tree).filter((node) => node.type === 'Path').length, 0);
  assert.doesNotMatch(text(tree), /50%/);
  assert.match(text(tree), /Valor não informado/);
  const zero = data(0, 'VERDE');
  zero.financeiro.qualidade = 'SEM_COMPRAS';
  assert.equal(apresentarMeiaLua(zero).percentual, 0);
  assert.match(text(render({ dados: zero })), /Dados parciais/);
});

test('loading, erro, histórico e expansão não retêm o gráfico anterior', () => {
  const d = data(115, 'VERMELHO');
  assert.doesNotMatch(text(render({ dados: d, loading: true })), /115%/);
  assert.doesNotMatch(text(render({ dados: d, error: true })), /115%/);
  const historic = { ...d, orcamento: { disponibilidade: 'INDISPONIVEL', motivo: 'ORCAMENTO_HISTORICO_NAO_COMPROVADO' } };
  assert.match(text(render({ dados: historic })), /Orçamento deste mês não disponível/);
  assert.doesNotMatch(text(render({ dados: historic })), /115%|Excesso conhecido/);
  expanded = false;
  let tree = render({ dados: data(50, 'AMARELO') });
  assert.doesNotMatch(text(tree), /Abaixo de 50%/);
  const toggle = nodes(tree).find((node) => node.type === 'Pressable');
  toggle.props.onPress();
  tree = render({ dados: data(50, 'AMARELO') });
  assert.match(text(tree), /Abaixo de 50%/);
  const markers = nodes(tree).filter((node) => Array.isArray(node.props?.style) && node.props.style.some((style) => style?.width === 14 && style?.height === 12));
  assert.deepEqual(markers.map((node) => node.props.style[1].backgroundColor), ['#267344', '#926500', '#A64C14', '#B32646']);
  assert.ok(nodes(tree).some((node) => node.props.accessibilityRole === 'progressbar'));
});
