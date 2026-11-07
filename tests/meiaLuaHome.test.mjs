import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformSync } from '@babel/core';

const base = new URL('../', import.meta.url);
const helper = await readFile(new URL('src/utils/meiaLuaHome.js', base), 'utf8');
const { apresentarMeiaLua, CORES_ORCAMENTO } = await import(`data:text/javascript;base64,${Buffer.from(helper).toString('base64')}`);
const moneySource = await readFile(new URL('src/utils/metaMoney.js', base), 'utf8');
const { valorRealParaCentavos } = await import(`data:text/javascript;base64,${Buffer.from(moneySource).toString('base64')}`);
const data = (percent) => ({
  financeiro: { qualidade: 'COMPLETO', cobertura: 'COMPLETA', comprasSemValor: 0, totalConhecidoCentavos: percent * 200 },
  orcamento: { disponibilidade: 'REFERENCIA_ATUAL', valorCentavos: 20000, percentualConhecido: percent, excessoConhecidoCentavos: percent > 100 ? (percent - 100) * 200 : 0 },
});
const source = await readFile(new URL('src/components/HomeComponents/CardFinanceiroHome.js', base), 'utf8');
const code = transformSync(
  source.replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function'),
  { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'] },
).code;
const styleSource = await readFile(new URL('src/components/HomeComponents/CardFinanceiroHome.styles.js', base), 'utf8');
const styles = new Function('StyleSheet', styleSource.replace(/^import .*;\r?\n/gm, '').replace('export const', 'const') + ';return styles;')({ create: (value) => value });
let expanded = false;
const React = { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) };
const render = new Function(
  'styles', 'React', 'View', 'Text', 'Pressable', 'ActivityIndicator', 'Svg', 'Path', 'MaterialCommunityIcons',
  'useState', 'apresentarMeiaLua', 'CORES_ORCAMENTO', 'valorRealParaCentavos', `${code};return CardFinanceiroHome;`,
)(styles, React, 'View', 'Text', 'Pressable', 'Spinner', 'Svg', 'Path', 'Icon', (initial) => [expanded, (value) => { expanded = value; }], apresentarMeiaLua, CORES_ORCAMENTO, valorRealParaCentavos);
const nodes = (value) => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.children)] : [];
const text = (value) => Array.isArray(value) ? value.map(text).join(' ') : value && typeof value === 'object' ? text(value.children) : value == null || value === false ? '' : String(value);

for (const [percent, state, color] of [[0, 'VERDE', '#267344'], [16.6, 'VERDE', '#267344'], [49, 'VERDE', '#267344'], [50, 'AMARELO', '#926500'], [74, 'AMARELO', '#926500'], [75, 'LARANJA', '#A64C14'], [100, 'LARANJA', '#A64C14'], [115, 'VERMELHO', '#B32646']]) {
  test(`semicircle ${String(percent).replace('.', ',')}%`, () => {
    const item = data(percent);
    const tree = render({ dados: item });
    const chart = apresentarMeiaLua(item);
    assert.equal(chart.progresso, Math.min(1, percent / 100));
    assert.equal(chart.cor, color);
    assert.equal(chart.estado, state);
    const paths = nodes(tree).filter((node) => node.type === 'Path');
    assert.equal(paths[0].props.d, 'M 20 120 A 100 100 0 0 1 220 120');
    assert.equal(paths.length, percent === 0 ? 1 : 2);
    if (percent > 0) assert.equal(paths[1].props.stroke, color);
    assert.match(text(tree), new RegExp(`${String(percent).replace('.', ',')}%`));
  });
}

test('historical, invalid and unknown budgets never show percentage or excess', () => {
  for (const budget of [
    { disponibilidade: 'INDISPONIVEL', motivo: 'ORCAMENTO_HISTORICO_NAO_COMPROVADO' },
    { disponibilidade: 'REFERENCIA_ATUAL', valorCentavos: 0 },
    { disponibilidade: 'REFERENCIA_ATUAL', valorCentavos: -1 },
  ]) {
    const item = { ...data(115), orcamento: { ...data(115).orcamento, ...budget } };
    const chart = apresentarMeiaLua(item);
    assert.equal(chart.percentual, null);
    assert.equal(chart.excesso, null);
    assert.equal(chart.estado, 'NEUTRO');
  }
  const insufficient = data(0);
  insufficient.financeiro.qualidade = 'INSUFICIENTE';
  assert.equal(apresentarMeiaLua(insufficient).compras, null);
});

test('orçamento fixo continua disponível no mês histórico sem inventar dados', () => {
  const item = { ...data(50), orcamento: { disponibilidade: 'INDISPONIVEL', motivo: 'ORCAMENTO_HISTORICO_NAO_COMPROVADO' } };
  const chart = apresentarMeiaLua(item, valorRealParaCentavos('200,00'));
  assert.equal(chart.orcamento, 20000);
  assert.equal(chart.percentual, 50);
  assert.equal(chart.restante, 10000);
  assert.match(text(render({ dados: item, orcamentoFixo: '200,00' })), /50%/);
});

test('partial utilization keeps excess and incomplete-data caveat', () => {
  const item = data(115);
  item.financeiro.qualidade = 'PARCIAL';
  item.financeiro.comprasSemValor = 1;
  const rendered = text(render({ dados: item }));
  assert.match(rendered, /Acima do orçamento/);
  assert.match(rendered, /sem valor informado/);
});

test('missing data and invalid percentages never get a utilization band', () => {
  const unavailable = [null, {}, { orcamento: data(50).orcamento }, { ...data(50), financeiro: { qualidade: 'INSUFICIENTE' } }, { ...data(50), orcamento: { ...data(50).orcamento, valorCentavos: Infinity } }];
  for (const percent of [null, undefined, -1, NaN, Infinity, '50']) unavailable.push({ ...data(50), orcamento: { ...data(50).orcamento, percentualConhecido: percent } });
  for (const item of unavailable) {
    const chart = apresentarMeiaLua(item);
    assert.equal(chart.estado, 'NEUTRO');
    assert.equal(chart.cor, CORES_ORCAMENTO.NEUTRO);
    assert.equal(chart.percentual, null);
    assert.equal(chart.excesso, null);
    assert.equal(chart.progresso, 0);
  }
});

test('loading, error and empty states do not retain the previous chart', () => {
  const item = data(115);
  assert.doesNotMatch(text(render({ dados: item, loading: true })), /115%/);
  assert.doesNotMatch(text(render({ dados: item, error: true })), /115%/);
  for (const props of [{ dados: item, loading: true }, { dados: item, error: true }, {}]) assert.equal(nodes(render(props)).filter((node) => node.type === 'Path').length, 0);
  const empty = data(0);
  empty.financeiro.qualidade = 'SEM_COMPRAS';
  assert.match(text(render({ dados: empty })), /0%/);
  assert.doesNotMatch(text(render({ dados: empty })), /Sem compras confirmadas/);
});

test('legend expands and gauge remains accessible', () => {
  expanded = false;
  let tree = render({ dados: data(50) });
  assert.doesNotMatch(text(tree), /Abaixo de 50%/);
  const toggle = nodes(tree).find((node) => node.type === 'Pressable');
  toggle.props.onPress();
  tree = render({ dados: data(50) });
  assert.match(text(tree), /Abaixo de 50%/);
  assert.ok(nodes(tree).some((node) => node.props.accessibilityRole === 'progressbar'));
  assert.equal(styles.metrics.flexWrap, 'wrap');
  assert.equal(styles.infoButton.minHeight, 48);
  assert.equal(styles.gauge.width, 180);
  assert.equal(styles.gauge.maxWidth, '100%');
  expanded = false;
});
