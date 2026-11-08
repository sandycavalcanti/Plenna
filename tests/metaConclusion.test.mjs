import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const source = (await read('src/utils/confirmarConclusaoMeta.js'))
  .replace(/^import .*;\r?\n/gm, '')
  .replace(/^export /gm, '');
const helper = new Function('Alert', 'formatarValorMeta', `${source}; return confirmarConclusaoMeta;`);

function run(meta) {
  const alerts = [];
  let confirmed = false;
  const confirmar = helper({ alert: (...args) => alerts.push(args) }, (value) => value == null ? null : `R$ ${value}`);
  confirmar(meta, () => { confirmed = true; });
  return { alert: alerts[0], confirm: () => alerts[0][2][1].onPress(), confirmed: () => confirmed };
}

test('concluir meta abaixo de 100% confirma sem criar movimentação', () => {
  const result = run({ meta_valor: '400,00', meta_valor_reservado: '250,00', progresso_percentual: 62.5, meta_completado: false });
  assert.equal(result.alert[0], 'Concluir esta meta?');
  assert.match(result.alert[1], /Nenhum depósito adicional será registrado/);
  assert.equal(result.confirmed(), false);
  result.confirm();
  assert.equal(result.confirmed(), true);
});

test('concluir meta em 100% continua sendo ação explícita', () => {
  const result = run({ meta_valor: '500,00', meta_valor_reservado: '500,00', progresso_percentual: 100, meta_completado: false });
  assert.equal(result.alert[0], 'Concluir esta meta?');
  assert.match(result.alert[1], /não registra depósitos ou retiradas/);
});

test('reabrir meta também preserva saldo e movimentações', () => {
  const result = run({ meta_valor: '500,00', meta_valor_reservado: '250,00', meta_completado: true });
  assert.equal(result.alert[0], 'Reabrir esta meta?');
  assert.match(result.alert[1], /saldo reservado/);
});

test('Perfil e detalhes reutilizam a confirmação compartilhada', async () => {
  const profile = await read('src/components/ProfileComponents/Metas/index.js');
  const details = await read('src/pages/MetaDetailsScreen/index.js');
  assert.match(profile, /confirmarConclusaoMeta/);
  assert.match(details, /confirmarConclusaoMeta/);
});
