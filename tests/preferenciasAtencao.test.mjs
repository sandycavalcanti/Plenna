import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const parser = require('@babel/parser');

const codigo = readFileSync(
  new URL('../src/components/PreferencesForm/index.js', import.meta.url),
  'utf8'
);

const ast = parser.parse(codigo, {
  sourceType: 'module',
  plugins: ['jsx'],
});

const componente = ast.program.body.find(
  (node) => node.type === 'ExportDefaultDeclaration'
)?.declaration;

const declaracoes = componente.body.body
  .filter((node) => node.type === 'VariableDeclaration')
  .flatMap((node) => node.declarations);

const regra = declaracoes.find(
  (node) => node.id.name === 'mostrarOrientacaoAtencao'
)?.init;

function avaliar(node, valores) {
  if (node.type === 'Identifier') return valores[node.name];
  if (node.type === 'NumericLiteral') return node.value;

  if (node.type === 'LogicalExpression' && node.operator === '&&') {
    return avaliar(node.left, valores) && avaliar(node.right, valores);
  }

  if (node.type === 'BinaryExpression' && node.operator === '>') {
    return avaliar(node.left, valores) > avaliar(node.right, valores);
  }

  throw new Error(`Expressão não suportada: ${node.type}`);
}

function mostrarOrientacao(limiteMensalAtual, valorAtencaoAtual) {
  assert.ok(regra, 'Regra de orientação não encontrada');
  return Boolean(avaliar(regra, {
    limiteMensalAtual,
    valorAtencaoAtual,
  }));
}

test('valor de atenção superior ao orçamento mostra orientação', () => {
  assert.equal(mostrarOrientacao(500, 800), true);
});

test('valor de atenção igual ao orçamento não mostra orientação', () => {
  assert.equal(mostrarOrientacao(500, 500), false);
});

test('valor de atenção inferior ao orçamento não mostra orientação', () => {
  assert.equal(mostrarOrientacao(500, 300), false);
});

test('orçamento não informado não mostra orientação', () => {
  assert.equal(mostrarOrientacao(0, 800), false);
});

test('orientação é contextual e não altera os valores', () => {
  assert.match(codigo, /Valor de atenção por compra/);
  assert.match(codigo, /\{mostrarOrientacaoAtencao && \(/);
  assert.match(codigo, /Acima do orçamento mensal\. Você pode manter esse valor\./);
});
