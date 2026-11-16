import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const loadExpirationHelper = async () => {
  const source = await read('src/utils/recomendacaoExpiracao.js');
  return new Function(`${source.replace('export function estaRecomendacaoExpirada', 'function estaRecomendacaoExpirada')}; return estaRecomendacaoExpirada;`)();
};

test('recomendação expirada é identificada pelo instante da API, incluindo o limite exato', async () => {
  const estaRecomendacaoExpirada = await loadExpirationHelper();
  const agora = new Date('2026-11-15T12:00:00.000Z');
  assert.equal(estaRecomendacaoExpirada('2026-11-15T11:59:59.999Z', agora), true);
  assert.equal(estaRecomendacaoExpirada('2026-11-15T12:00:00.000Z', agora), true);
  assert.equal(estaRecomendacaoExpirada('2026-11-15T12:00:00.001Z', agora), false);
});

test('datas com fuso e data sem horário são comparadas sem usar o mês selecionado', async () => {
  const estaRecomendacaoExpirada = await loadExpirationHelper();
  assert.equal(estaRecomendacaoExpirada('2026-11-16T00:00:00-03:00', new Date('2026-11-16T02:59:59.999Z')), false);
  assert.equal(estaRecomendacaoExpirada('2026-11-16T00:00:00-03:00', new Date('2026-11-16T03:00:00.000Z')), true);
  assert.equal(estaRecomendacaoExpirada('2026-11-16', new Date('2026-11-15T23:59:59.999Z')), false);
  assert.equal(estaRecomendacaoExpirada('2026-11-16', new Date('2026-11-16T00:00:00.000Z')), true);
});

test('sem data ou com data inválida a recomendação não perde ações', async () => {
  const estaRecomendacaoExpirada = await loadExpirationHelper();
  const agora = new Date('2026-11-15T12:00:00.000Z');
  assert.equal(estaRecomendacaoExpirada(null, agora), false);
  assert.equal(estaRecomendacaoExpirada(undefined, agora), false);
  assert.equal(estaRecomendacaoExpirada('', agora), false);
  assert.equal(estaRecomendacaoExpirada('data-inválida', agora), false);
});

test('Home condiciona as ações do card à expiração da recomendação', async () => {
  const home = await read('src/pages/HomeScreen/index.js');
  assert.match(home, /estaRecomendacaoExpirada\(item\.expiraEm\)/);
  assert.match(home, /onPress=\{\(\) => conversarSobreRecomendacao\(item\)\}/);
  assert.match(home, /onPress=\{\(\) => recomendacoes\.updateStatus\(item\.id, 'DESCARTADA'\)\}/);
  assert.match(home, /estaRecomendacaoExpirada\(item\.expiraEm\)[\s\S]*?DESCARTADA/);
});
