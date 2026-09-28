import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from '@babel/core';

const source = await readFile(new URL('../src/components/ProfileComponents/Permissions/index.js', import.meta.url), 'utf8');
const { ast } = transformSync(source, {
  filename: 'Permissions.js', configFile: false, babelrc: false,
  plugins: ['@babel/plugin-transform-react-jsx'], ast: true, code: false,
});
const logger = ast.program.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'logErroMonitoramento');
const helper = (await readFile(new URL('../src/utils/error.js', import.meta.url), 'utf8'))
  .replace("import { ToastAndroid } from 'react-native';", '')
  .replace('export function logApiErrors', 'function logApiErrors');

// Executa o adaptador real e o helper compartilhado real, capturando a saída final.
function preparar(dev = true) {
  const logs = [];
  const context = vm.createContext({
    __DEV__: dev,
    console: { error: (...args) => logs.push(args) },
    ToastAndroid: { show() { assert.fail('Não deve exibir toast'); } },
  });
  vm.runInContext(helper + '\n' + source.slice(logger.start, logger.end), context);
  return { logs, log: context.logErroMonitoramento };
}

test('erro Axios com JWT/config/body produz apenas metadados permitidos e mensagem fixa', () => {
  const { logs, log } = preparar();
  const segredo = 'SEGREDO_NAO_DEVE_APARECER';
  const error = {
    code: 'ERR_BAD_RESPONSE', message: segredo,
    config: { headers: { authorization: 'Bearer ' + segredo } },
    request: { segredo },
    response: { status: 503, data: { message: segredo, token: segredo }, headers: { segredo } },
  };
  log(error, 'Erro ao carregar monitoramento:');
  assert.deepEqual(JSON.parse(JSON.stringify(logs)), [[
    'Erro ao carregar monitoramento:',
    { status: 503, codigo: 'ERR_BAD_RESPONSE', mensagem: 'Não foi possível concluir a operação de monitoramento.' },
  ]]);
  assert.equal(JSON.stringify(logs).includes(segredo), false);
});

test('falha de rede sem response não utiliza fallback para o erro inteiro', () => {
  const { logs, log } = preparar();
  log({ code: 'ERR_NETWORK', message: 'Bearer SEGREDO', config: { token: 'SEGREDO' } }, 'Erro ao ativar monitoramento:');
  assert.equal(logs[0][1].codigo, 'ERR_NETWORK');
  assert.equal(logs[0][1].status, undefined);
  assert.equal(JSON.stringify(logs).includes('SEGREDO'), false);
});

test('status e código arbitrários não são repassados nem convertidos em texto', () => {
  for (const status of ['503 SEGREDO', 999, NaN, { segredo: true }]) {
    const { logs, log } = preparar();
    log({ response: { status }, code: 'SEGREDO' }, 'Erro ao desativar monitoramento:');
    assert.equal(logs[0][1].status, undefined);
    assert.equal(logs[0][1].codigo, undefined);
    assert.equal(JSON.stringify(logs).includes('SEGREDO'), false);
  }
});

test('mensagem, body, headers e config do erro original nunca são lidos', () => {
  const { log } = preparar();
  const proibido = { get() { assert.fail('Campo sensível acessado'); } };
  const response = { status: 403 };
  Object.defineProperties(response, { data: proibido, headers: proibido });
  const error = { response, code: 'ERR_BAD_REQUEST' };
  Object.defineProperties(error, { message: proibido, config: proibido, request: proibido });
  log(error, 'Erro ao desativar monitoramento:');
});

test('produção não lê nem registra o erro', () => {
  const { logs, log } = preparar(false);
  log(new Proxy({}, { get() { assert.fail('Erro acessado em produção'); } }), 'Erro ao carregar monitoramento:');
  assert.equal(logs.length, 0);
});

test('erros ausentes continuam produzindo apenas mensagem fixa em desenvolvimento', () => {
  const { logs, log } = preparar();
  for (const error of [null, undefined, 'SEGREDO']) log(error, 'Erro ao carregar monitoramento:');
  assert.equal(logs.length, 3);
  assert.equal(JSON.stringify(logs).includes('SEGREDO'), false);
});

test('os três pontos do componente usam o adaptador com rótulos fixos, sem console direto', () => {
  const chamadas = [];
  function visitar(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression') {
      assert.notEqual(node.callee?.object?.name, 'console');
      if (node.callee?.name === 'logErroMonitoramento') {
        assert.equal(node.arguments[0].name, 'error');
        assert.equal(node.arguments[1].type, 'StringLiteral');
        chamadas.push(node.arguments[1].value);
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visitar);
      else if (value && typeof value === 'object') visitar(value);
    }
  }
  visitar(ast.program);
  assert.deepEqual(chamadas, [
    'Erro ao carregar monitoramento:', 'Erro ao desativar monitoramento:', 'Erro ao ativar monitoramento:',
  ]);
});
