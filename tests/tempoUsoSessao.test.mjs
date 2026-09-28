import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import axios from 'axios';

function gate() {
  let release, started;
  return { wait: new Promise(r => { release = r; }), entered: new Promise(r => { started = r; }),
    release: () => release(), start: () => started() };
}

async function preparar(initialToken = 'token-ficticio-A') {
  const state = { stored: initialToken, calls: [], gates: {}, nativeCalls: 0, effects: [], cooldownWrites: 0 };
  async function pause(stage) {
    const g = state.gates[stage];
    if (g) { g.start(); await g.wait; }
  }
  const context = vm.createContext({ AbortController, __DEV__: false });
  const root = new URL('../', import.meta.url);
  const modules = new Map();
  const loading = new Map();
  const storage = {
    async getItem(key) {
      if (key === '@plenna:tempoUsoUltimoSync') { await pause('cooldown'); return null; }
      const value = state.stored; await pause('storage'); return value;
    },
    async setItem(key, value) {
      if (key === '@plenna:tempoUsoUltimoSync') { state.cooldownWrites++; return; }
      await pause('write'); state.stored = value;
    },
    async removeItem() { state.stored = null; },
  };
  const mocks = new Map([
    [
  new URL('src/api/tempoUso.js', root).href,
  {
    async listarAplicativosTempoUso(config = {}) {
     const client = axios.create({
        headers: {
          Authorization: `Bearer ${state.stored}`,
        },
        baseURL: 'https://teste.invalid',
        adapter: async requestConfig => {
         state.calls.push({
        url: requestConfig.url,
        authorization: requestConfig.headers?.authorization,
        rf017SessionId: config.rf017SessionId,
      });
          await pause('/tempo-uso/aplicativos');

          return {
            data: {
              versao: 1,
              aplicativos: [
                { packageId: 'com.shopee.br', nomeApp: 'Shopee' },
              ],
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: requestConfig,
          };
        },
      });

      const response = await client.get('/tempo-uso/aplicativos', config);
      return response.data;
    },

    async sincronizarTempoUso(payload, config = {}) {
  state.calls.push({
    url: '/tempo-uso/sync',
    rf017SessionId: config.rf017SessionId,
  });

  await pause('/tempo-uso/sync');

  return {
    recebidos: payload?.registros?.length ?? 0,
    persistidos: payload?.registros?.length ?? 0,
  };
},
  },
],
    ['react', { useRef: current => ({ current }), useEffect: effect => state.effects.push(effect) }],
    ['react-native', { AppState: { currentState: 'active', addEventListener() { return { remove() {} }; } } }],
    ['@react-native-async-storage/async-storage', { default: storage }],
    ['axios', { default: { create(config) {
      return axios.create({ ...config, adapter: async config => {
        state.calls.push({ url: config.url, authorization: config.headers.authorization });
        await pause(config.url);
        const data = config.url === '/consentimento'
          ? [{ consentimento_tipo_codigo: 'MONITORAMENTO_TEMPO_USO', consentimento_status: true }]
          : config.url === '/tempo-uso/aplicativos'
            ? { versao: 1, aplicativos: [{ packageId: 'com.shopee.br', nomeApp: 'Shopee' }] }
            : { recebidos: 1, persistidos: 1 };
        return { data, status: 200, statusText: 'OK', headers: {}, config };
      } });
    } } }],
    [new URL('src/constants/config.js', root).href, { urlAPI: 'https://teste.invalid' }],
    [new URL('modules/plenna-usage-stats.js', root).href, {
      async hasUsageAccess() { await pause('usageAccess'); return true; },
      async getForegroundUsage() {
        state.nativeCalls++; await pause('coleta');
        return [{ packageName: 'com.shopee.br', durationSeconds: 60 }];
      },
    }],
  ]);
  function load(id) {
    if (!loading.has(id)) loading.set(id, build(id));
    return loading.get(id);
  }
  async function build(id) {
    const mock = mocks.get(id);
    const mod = mock ? new vm.SyntheticModule(Object.keys(mock), function () {
      for (const [k, v] of Object.entries(mock)) this.setExport(k, v);
    }, { context, identifier: id }) : new vm.SourceTextModule(await readFile(new URL(id), 'utf8'), { context, identifier: id });
    modules.set(id, mod);
    await mod.link((name, parent) => load(name.startsWith('.') ? new URL(name + '.js', parent.identifier).href : name));
    return mod;
  }
  const service = await load(new URL('src/services/tempoUsoSyncService.js', root).href);
  await service.evaluate();
  const tokenStorage = modules.get(new URL('src/api/tokenStorage.js', root).href).namespace.tokenStorage;
  return { state, tokenStorage, sync: service.namespace.sincronizarTempoUsoDoDia,
    async mountHook() {
      const hook = await load(new URL('src/hooks/useTempoUsoSync.js', root).href);
      if (hook.status !== 'evaluated') await hook.evaluate();
      hook.namespace.useTempoUsoSync();
      return state.effects.pop()();
    },
  };
}

test('sessão estável usa o mesmo token em consentimento, catálogo e PUT', async () => {
  const { state, sync } = await preparar();
  assert.equal((await sync()).sincronizado, true);
  const chamadasComAuthorization = state.calls.filter(
  c => c.authorization !== undefined
);

assert.ok(
  chamadasComAuthorization.every(
    c => c.authorization === 'Bearer token-ficticio-A'
  )
);
  const urls = state.calls.map(c => c.url);

  assert.ok(urls.filter(url => url === '/consentimento').length >= 1);
  assert.equal(urls.filter(url => url === '/tempo-uso/aplicativos').length, 1);
  assert.equal(urls.filter(url => url === '/tempo-uso/sync').length, 1);

  assert.equal(urls[0], '/consentimento');
  assert.equal(urls.at(-1), '/tempo-uso/sync');
  const puts = state.calls.filter(c => c.url === '/tempo-uso/sync');

assert.equal(puts.length, 1);
assert.equal(typeof puts[0].rf017SessionId, 'number');
});

for (const stage of ['/consentimento', 'usageAccess', '/tempo-uso/aplicativos', 'coleta']) {
  for (const action of ['logout', 'login B']) test(action + ' durante ' + stage + ' impede PUT', async () => {
    const { state, tokenStorage, sync } = await preparar();
    const g = state.gates[stage] = gate();
    const result = sync();
    await g.entered;
    if (action === 'logout') await tokenStorage.clearToken();
    else await tokenStorage.setToken('token-ficticio-B');
    g.release();
    assert.equal((await result).motivo, 'sessao_invalidada');
    assert.equal(state.calls.some(c => c.url === '/tempo-uso/sync'), false);
  });
}

test('execuÃ§Ãµes concorrentes da mesma sessÃ£o compartilham coleta e PUT', async () => {
  const { state, sync } = await preparar();
  const g = state.gates.coleta = gate();
  const first = sync();
  await g.entered;
  const second = sync();
  g.release();
  const results = await Promise.all([first, second]);
  assert.ok(results.every(r => r.sincronizado));
  assert.equal(state.nativeCalls, 3);
  assert.equal(state.calls.filter(c => c.url === '/tempo-uso/sync').length, 1);
});

test('nova sessão aguarda coleta antiga e sincroniza após descarte da sessão anterior', async () => {
  const { state, tokenStorage, sync } = await preparar();

  const g = state.gates.coleta = gate();

  const old = sync();
  await g.entered;

  await tokenStorage.setToken('token-ficticio-B');

  delete state.gates.coleta;

  const next = sync();

  // Libera a consulta nativa antiga.
  // A nova sessão deve prosseguir somente depois que ela terminar.
  g.release();

  const oldResult = await old;
  const nextResult = await next;

  assert.equal(oldResult.motivo, 'sessao_invalidada');
  assert.equal(nextResult.sincronizado, true);

 const puts = state.calls.filter(c => c.url === '/tempo-uso/sync');

  assert.equal(puts.length, 1);
  assert.ok(puts[0].rf017SessionId);
});

test('token ausente nÃ£o consulta API nem coleta', async () => {
  const { state, sync } = await preparar(null);
  assert.equal((await sync()).motivo, 'sem_token');
  assert.equal(state.calls.length, 0);
  assert.equal(state.nativeCalls, 0);
});

test('sessÃ£o capturada e invalidada antes da execuÃ§Ã£o nÃ£o inicia requisiÃ§Ãµes', async () => {
  const { state, tokenStorage, sync } = await preparar();
  const session = await tokenStorage.captureSession();
  await tokenStorage.clearToken();
  assert.equal((await sync(session)).motivo, 'sessao_invalidada');
  assert.equal(state.calls.length, 0);
});

test('troca enquanto interceptor aguarda token do PUT bloqueia despacho com token B', async () => {
  const { state, tokenStorage, sync } = await preparar();
  const original = tokenStorage.getToken;
  const g = gate();
  let reads = 0;
  tokenStorage.getToken = async () => {
    if (++reads === 3) { g.start(); await g.wait; }
    return original();
  };
  const result = sync();
  await g.entered;
  await tokenStorage.setToken('token-ficticio-B');
  g.release();
  assert.equal((await result).motivo, 'sessao_invalidada');
  assert.equal(state.calls.some(c => c.url === '/tempo-uso/sync'), false);
});

test('logout durante PUT jÃ¡ despachado cancela resultado sem marcar sucesso', async () => {
  const { state, tokenStorage, sync } = await preparar();
  const g = state.gates['/tempo-uso/sync'] = gate();
  const result = sync();
  await g.entered;
  await tokenStorage.clearToken();
  g.release();
  assert.equal((await result).motivo, 'sessao_invalidada');
  assert.equal(state.calls.filter(c => c.url === '/tempo-uso/sync').length, 1);
});

test('leitura antiga do armazenamento nÃ£o restaura token apÃ³s logout', async () => {
  const { state, tokenStorage, sync } = await preparar();
  const g = state.gates.storage = gate();
  const result = sync();
  await g.entered;
  await tokenStorage.clearToken();
  g.release();
  assert.equal((await result).motivo, 'sessao_invalidada');
  assert.equal(await tokenStorage.getToken(), null);
  assert.equal(state.calls.length, 0);
});

test('logout/login com o mesmo token invalida geraÃ§Ã£o anterior sem expor token no snapshot', async () => {
  const { tokenStorage } = await preparar();
  const session = await tokenStorage.captureSession();
  assert.deepEqual(Object.keys(session).sort(), ['id', 'signal']);
  await tokenStorage.clearToken();
  await tokenStorage.setToken('token-ficticio-A');
  assert.equal(session.signal.aborted, true);
  assert.throws(() => tokenStorage.assertSession(session.id), { code: 'RF017_SESSION_INVALIDATED' });
});

test('gravaÃ§Ãµes concorrentes preservam ordem login/logout no armazenamento existente', async () => {
  const { state, tokenStorage } = await preparar();
  const g = state.gates.write = gate();
  const login = tokenStorage.setToken('token-ficticio-B');
  await g.entered;
  const logout = tokenStorage.clearToken();
  assert.equal(await tokenStorage.getToken(), null);
  g.release();
  await Promise.all([login, logout]);
  assert.equal(state.stored, null);
});


test('duas montagens do hook compartilham execução; logout impede sucesso', async () => {
  const { state, tokenStorage, mountHook } = await preparar();
  const g = state.gates.coleta = gate();
  const cleanupA = await mountHook();
  await g.entered;
  const cleanupB = await mountHook();
  await new Promise(setImmediate);
  assert.equal(state.nativeCalls, 1);
  await tokenStorage.clearToken();
  g.release();
  await new Promise(setImmediate);
  assert.equal(state.calls.some(c => c.url === '/tempo-uso/sync'), false);
  cleanupA(); cleanupB();
});