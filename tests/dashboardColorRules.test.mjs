import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { transformSync } from '@babel/core';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const meiaLuaSource = await read('src/utils/meiaLuaHome.js');
const distributionSource = await read('src/utils/distribuicaoClassificacoes.js');
const { corPorProporcao, faixaPorPercentual, CORES_ORCAMENTO } = await import(`data:text/javascript;base64,${Buffer.from(meiaLuaSource).toString('base64')}`);
const { distribuicaoClassificacoes } = await import(`data:text/javascript;base64,${Buffer.from(distributionSource).toString('base64')}`);

test('proporções de compras acima do limite usam intensidade e ausência neutra', () => {
  const cases = [
    [0, 0, 'NEUTRO'],
    [0, 10, 'VERDE'],
    [1, 10, 'VERDE'],
    [2, 6, 'AMARELO'],
    [2, 4, 'AMARELO'],
    [3, 4, 'VERMELHO'],
    [4, 4, 'VERMELHO'],
  ];

  for (const [above, total, expected] of cases) {
    const color = corPorProporcao(above, total, 'RISCO');
    assert.equal(color, expected === 'NEUTRO' ? CORES_ORCAMENTO.NEUTRO : CORES_ORCAMENTO[expected]);
  }
});

test('limites exatos da escala de risco são inclusivos nos pontos definidos', () => {
  assert.equal(faixaPorPercentual(25, 'RISCO'), 'VERDE');
  assert.equal(faixaPorPercentual(25.01, 'RISCO'), 'AMARELO');
  assert.equal(faixaPorPercentual(50, 'RISCO'), 'AMARELO');
  assert.equal(faixaPorPercentual(50.01, 'RISCO'), 'LARANJA');
  assert.equal(faixaPorPercentual(75, 'RISCO'), 'VERMELHO');
});

test('classificações mantêm cores semânticas independentemente da ordem recebida', () => {
  const rows = [
    { compra_classificacao: 'PENDENTE', quantidade_total: 3 },
    { compra_classificacao: 'NAO_IMPULSIVA', quantidade_total: 4 },
    { compra_classificacao: 'IMPULSIVA', quantidade_total: 2 },
  ];
  const reversed = distribuicaoClassificacoes([...rows].reverse());
  const colors = Object.fromEntries(reversed.groups.map((group) => [group.codigo, group.cor]));

  assert.equal(colors.IMPULSIVA, '#B32646');
  assert.equal(colors.NAO_IMPULSIVA, '#267344');
  assert.equal(colors.PENDENTE, '#76658A');
  assert.equal(reversed.groups.reduce((sum, group) => sum + group.quantidade, 0), 9);
});

test('componentes usam o helper de proporção e as cores fixas das classificações', async () => {
  const source = await read('src/components/DashboardComponents/Impulsividade/index.js');
  assert.match(source, /corPorProporcao\(above, total, 'RISCO'\)/);
  assert.match(source, /backgroundColor: group\.cor/);

  const code = transformSync(
    source.replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function'),
    { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'] },
  ).code;
  const React = {
    Fragment: ({ children }) => children,
    createElement: (type, props, ...children) => typeof type === 'function'
      ? type({ ...(props || {}), children })
      : { type, props: props || {}, children },
  };
  const ProfileCard = ({ title, children }) => React.createElement('ProfileCard', { title }, children);
  const AppEmptyState = (props) => React.createElement('AppEmptyState', props);
  const styles = new Proxy({}, { get: (_, key) => key });
  const Component = new Function(
    'React', 'View', 'Text', 'Pressable', 'Svg', 'Circle', 'ProfileCard', 'AppEmptyState', 'styles', 'DASHBOARD_THEME', 'distribuicaoClassificacoes', 'corPorProporcao',
    `${code}; return Impulsividade;`,
  )(React, 'View', 'Text', 'Pressable', 'Svg', 'Circle', ProfileCard, AppEmptyState, styles, { colors: { track: '#EEE8F2' } }, distribuicaoClassificacoes, corPorProporcao);
  const nodes = (value) => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.children)] : [];
  const classificationTree = Component({ data: [{ compra_classificacao: 'PENDENTE', quantidade_total: 3 }, { compra_classificacao: 'NAO_IMPULSIVA', quantidade_total: 4 }, { compra_classificacao: 'IMPULSIVA', quantidade_total: 2 }] });
  const strokes = nodes(classificationTree).filter((node) => node.type === 'Circle').map((node) => node.props.stroke);
  assert.ok(strokes.includes('#B32646'));
  assert.ok(strokes.includes('#267344'));
  assert.ok(strokes.includes('#76658A'));

  const limitTree = Component({ data: { acima_limite: 2, dentro_limite: 4 }, title: 'Compras acima do limite', centerValueMode: 'quantity', totalKey: 'acima_limite' });
  const limitStroke = nodes(limitTree).find((node) => node.type === 'Circle' && node.props.stroke !== '#EAE3F7')?.props.stroke;
  assert.equal(limitStroke, '#926500');
});
