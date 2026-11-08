import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { transformSync } from '@babel/core';

const base = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, base), 'utf8');
const source = await read('src/components/HomeComponents/CardFinanceiroHome.js');
const moneySource = await read('src/utils/metaMoney.js');
const meiaLuaSource = await read('src/utils/meiaLuaHome.js');
const { valorRealParaCentavos } = await import(`data:text/javascript;base64,${Buffer.from(moneySource).toString('base64')}`);
const { apresentarMeiaLua, CORES_ORCAMENTO } = await import(`data:text/javascript;base64,${Buffer.from(meiaLuaSource).toString('base64')}`);
const code = transformSync(
  source.replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function'),
  { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'] },
).code;
const React = { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) };
const nodes = (value) => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.children)] : [];
const text = (value) => Array.isArray(value) ? value.map(text).join(' ') : value && typeof value === 'object' ? text(value.children) : value == null || value === false ? '' : String(value);
const styles = { create: (value) => value };
const CardFinanceiroHome = new Function(
  'React', 'View', 'Text', 'Pressable', 'ActivityIndicator', 'StyleSheet', 'Svg', 'Path', 'MaterialCommunityIcons', 'useState', 'apresentarMeiaLua', 'CORES_ORCAMENTO', 'valorRealParaCentavos',
  `${code}; return CardFinanceiroHome;`,
)(React, 'View', 'Text', 'Pressable', 'Spinner', styles, 'Svg', 'Path', 'Icon', () => [false, () => {}], apresentarMeiaLua, CORES_ORCAMENTO, valorRealParaCentavos);

const data = (total, qualidade = 'COMPLETO', cobertura = 'COMPLETA') => ({
  financeiro: { qualidade, cobertura, comprasSemValor: qualidade === 'PARCIAL' ? 1 : 0, totalConhecidoCentavos: total },
  orcamento: { disponibilidade: 'REFERENCIA_ATUAL', valorCentavos: 20000, percentualConhecido: total / 200, excessoConhecidoCentavos: total > 20000 ? total - 20000 : 0 },
});

test('excesso comprovado usa texto vermelho e saldo disponível comprovado usa texto verde', () => {
  const exceededTree = CardFinanceiroHome({ dados: data(25000) });
  const exceeded = nodes(exceededTree).find((node) => node.type === 'Text' && text(node).includes('Excesso conhecido'));
  assert.ok(exceeded);
  assert.equal(exceeded.props.style[1].color, '#B32646');

  const availableTree = CardFinanceiroHome({ dados: data(5000) });
  const available = nodes(availableTree).find((node) => node.type === 'Text' && text(node).includes('Disponível no orçamento'));
  assert.ok(available);
  assert.equal(available.props.style[1].color, '#267344');
});

test('cobertura insuficiente não transforma saldo potencial em saldo comprovado', () => {
  const tree = CardFinanceiroHome({ dados: data(5000, 'PARCIAL', 'DESCONHECIDA') });
  assert.doesNotMatch(text(tree), /Disponível no orçamento/);
});

test('textos redundantes foram removidos apenas da explicação visual do indicador', () => {
  assert.doesNotMatch(source, /A utilização do orçamento não indica impulsividade nem representa saldo bancário/);
  assert.doesNotMatch(source, /Cobertura dos registros:/);
  assert.match(source, /f\.cobertura/);
});
