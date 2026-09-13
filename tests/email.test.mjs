import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = await readFile(new URL('../src/api/email.js', import.meta.url), 'utf8');
async function modulo(client, browser) {
  const context = vm.createContext({ URL });
  const api = new vm.SyntheticModule(['apiClient'], function () { this.setExport('apiClient', client); }, { context });
  const expo = new vm.SyntheticModule(['openAuthSessionAsync'], function () { this.setExport('openAuthSessionAsync', browser); }, { context });
  const mod = new vm.SourceTextModule(source, { context });
  await mod.link(specifier => specifier === './client' ? api : expo);
  await mod.evaluate();
  return mod.namespace;
}
function fixture(resultado) {
  const calls = [];
  const inicio = { tentativa: 'tentativa-teste', state: 'state-teste', segredo: 'segredo-teste', url: 'https://accounts.google.com/' };
  const client = { async post(path, body) {
    calls.push({ path, body });
    return { data: path === '/email/connect' ? inicio : { concluida: true } };
  } };
  return { calls, inicio, client, browser: async () => resultado };
}
test('sucesso correlacionado finaliza no backend, sem armazenamento permanente', async () => {
  const f = fixture({ type: 'success', url: 'plenna://oauth-success?state=state-teste&tentativa=tentativa-teste&code=code-teste' });
  const m = await modulo(f.client, f.browser);
  assert.equal((await m.conectarEmail()).cancelado, false);
  assert.equal(f.calls[1].path, '/email/finalize');
  assert.equal(f.calls[1].body.segredo, 'segredo-teste');
  assert.equal(f.calls[1].body.code, 'code-teste');
});
for (const type of ['cancel', 'dismiss']) test(type + ' cancela tentativa sem finalizar', async () => {
  const f = fixture({ type });
  const m = await modulo(f.client, f.browser);
  assert.equal((await m.conectarEmail()).cancelado, true);
  assert.equal(f.calls[1].path, '/email/cancel');
});
test('retorno de outra tentativa é rejeitado', async () => {
  const f = fixture({ type: 'success', url: 'plenna://oauth-success?state=outro&tentativa=tentativa-teste&code=code-teste' });
  const m = await modulo(f.client, f.browser);
  await assert.rejects(m.conectarEmail());
  assert.equal(f.calls.length, 1);
});
test('falha ambígua não propaga config Axios com segredo', async () => {
  const f = fixture({ type: 'success', url: 'plenna://oauth-success?state=state-teste&tentativa=tentativa-teste&code=code-teste' });
  const post = f.client.post;
  f.client.post = async (path, body) => {
    if (path === '/email/finalize') throw { message: 'segredo-teste', config: body };
    return post(path, body);
  };
  const m = await modulo(f.client, f.browser);
  await assert.rejects(m.conectarEmail(), error => !error.config && !error.message.includes('segredo-teste'));
});
test('cancelamento Google correlacionado não finaliza', async () => {
  const f = fixture({ type: 'success', url: 'plenna://oauth-success?state=state-teste&tentativa=tentativa-teste&resultado=cancelado' });
  const m = await modulo(f.client, f.browser);
  assert.equal((await m.conectarEmail()).cancelado, true);
  assert.equal(f.calls[1].path, '/email/cancel');
});
