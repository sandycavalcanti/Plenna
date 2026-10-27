import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function ambiente() {
  const chamadas = [];
  const armazenamento = new Map();
  const context = vm.createContext({ AbortController, console });
  const apiClient = {
    get: async (path, config) => {
      chamadas.push({ method: 'GET', path, config });
      return { data: { itens: [{ memoria_id: 1 }], proximo_cursor: null } };
    },
    post: async (path, body, config) => {
      chamadas.push({ method: 'POST', path, body, config });
      return { data: { memoria: { memoria_id: 2, conteudo: body.conteudo } } };
    },
    patch: async (path, body, config) => {
      chamadas.push({ method: 'PATCH', path, body, config });
      return { data: { memoria: { memoria_id: 2, ...body } } };
    },
    delete: async (path, config) => {
      chamadas.push({ method: 'DELETE', path, config });
      return { data: { memoria_id: 2, excluida: true } };
    },
  };
  const mocks = {
    'src/api/client.js': { apiClient },
    '@react-native-async-storage/async-storage': {
      default: {
        getItem: async key => armazenamento.get(key) ?? null,
        setItem: async (key, value) => armazenamento.set(key, value),
        removeItem: async key => armazenamento.delete(key),
      },
    },
  };
  const base = new URL('../', import.meta.url);
  const cache = new Map();

  async function load(name) {
    if (cache.has(name)) return cache.get(name);
    let module;
    if (mocks[name]) {
      const values = mocks[name];
      module = new vm.SyntheticModule(Object.keys(values), function setExports() {
        for (const [key, value] of Object.entries(values)) this.setExport(key, value);
      }, { context, identifier: name });
    } else {
      const source = await readFile(new URL(name, base), 'utf8');
      module = new vm.SourceTextModule(source, { context, identifier: name });
    }
    cache.set(name, module);
    await module.link((specifier, parent) => {
      if (!specifier.startsWith('.')) return load(specifier);
      let resolved = new URL(specifier, new URL(parent.identifier, base)).href.slice(base.href.length);
      if (!resolved.endsWith('.js')) resolved += '.js';
      return load(resolved);
    });
    if (module.status !== 'evaluated') await module.evaluate();
    return module;
  }

  const tokenStorage = (await load('src/api/tokenStorage.js')).namespace.tokenStorage;
  await tokenStorage.setToken('token-A');
  return {
    api: await load('src/api/memoria.js'),
    chamadas,
  };
}

test('API de memória usa sessão autenticada e expõe CRUD sem identidade no payload', async () => {
  const { api, chamadas } = await ambiente();

  await api.namespace.listarMemorias({ limite: 5 });
  await api.namespace.criarMemoria('Preferência declarada.');
  await api.namespace.atualizarMemoria(2, { conteudo: 'Atualizada.' });
  await api.namespace.inativarMemoria(2);
  await api.namespace.excluirMemoria(2);

  assert.deepEqual(chamadas.map(item => `${item.method} ${item.path}`), [
    'GET /memorias',
    'POST /memorias',
    'PATCH /memorias/2',
    'POST /memorias/2/inativar',
    'DELETE /memorias/2',
  ]);
  assert.equal(chamadas[1].body.origem, 'DECLARADA');
  assert.equal(chamadas[1].body.usuario_id, undefined);
  for (const chamada of chamadas) assert.equal(chamada.config.rf017SessionId, 1);
});
