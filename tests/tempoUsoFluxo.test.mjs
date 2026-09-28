import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transformSync } from '@babel/core';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

// Executa service, hook, consentimento, transporte, utilitários e tokenStorage reais.
// Apenas fronteiras HTTP/Android/storage/React são simuladas; não acessa a API publicada.
async function ambiente({ consentimento = true, permission = true, dev = false } = {}) {
  const state = {
    consentimento, permission, coletas: [], puts: [], posts: [], gets: [],
    effects: [], listeners: new Set(), native: null, post: null, get: null,
    storage: new Map(), states: [], removed: 0,
  };
  const context = vm.createContext({ AbortController, Date, console, __DEV__: dev });
  const react = {
    useEffect: effect => state.effects.push(effect),
    useRef: value => ({ current: value }),
    useState: value => {
      const index = state.states.push(value) - 1;
      return [value, next => { state.states[index] = next; }];
    },
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  };
  const appState = {
    currentState: 'active',
    addEventListener: (_, listener) => {
      state.listeners.add(listener);
      return { remove: () => { state.listeners.delete(listener); state.removed++; } };
    },
  };
  state.foreground = () => {
    for (const next of ['background', 'active']) {
      appState.currentState = next;
      for (const listener of state.listeners) listener(next);
    }
  };
  const apiClient = {
    get: async (path, config) => {
      state.gets.push({ path, config });
      if (state.get) await state.get(path, config);
      if (path === '/consentimento') return { data: state.consentimento === null ? [] : [{
        consentimento_tipo_codigo: 'MONITORAMENTO_TEMPO_USO', consentimento_status: state.consentimento,
      }] };
      if (path === '/tempo-uso/aplicativos') return { data: { versao: 1, aplicativos: [{
        packageId: 'com.shopee.br', nomeApp: 'Shopee',
      }] } };
      throw new Error('GET inesperado: ' + path);
    },
    post: async (path, body, config) => {
      state.posts.push({ path, body, config });
      if (state.post) await state.post(path, body, config);
      state.consentimento = body.status;
      return { data: { consentimento_status: body.status } };
    },
    put: async (...args) => { state.puts.push(args); throw new Error('PUT proibido nesta etapa'); },
  };
  const mocks = {
    'react': { ...react, default: react },
     'react-native': {
  AppState: appState,
  View: 'View',
  Text: 'Text',
  Switch: 'Switch',
  Alert: {
    alert: (...args) => {
      state.alert = args;
    },
  },
  ToastAndroid: {
    LONG: 1,
    show() {},
  },
},
    '@react-native-async-storage/async-storage': { default: {
      getItem: async key => state.storage.get(key) ?? null,
      setItem: async (key, value) => state.storage.set(key, value),
      removeItem: async key => state.storage.delete(key),
    } },
    'src/api/client.js': { apiClient },
    'modules/plenna-usage-stats.js': {
      getModuleStatus: async () => ({ available: true }),
      hasUsageAccess: async () => state.permission,
      openUsageAccessSettings: async () => { state.opened = true; return true; },
      getForegroundUsage: async (...args) => {
        state.coletas.push(args);
        if (state.native) return state.native(...args);
        return [{ packageName: 'com.shopee.br', durationSeconds: 1 }];
      },
    },
    'src/components/ProfileComponents/ProfileCard.js': { default: 'ProfileCard' },
    'src/components/ProfileComponents/Permissions/styles.js': { default: {} },
  };
  const base = new URL('../', import.meta.url);
  const cache = new Map();
  async function load(name) {
    if (cache.has(name)) return cache.get(name);
    let mod;
    if (mocks[name]) {
      const values = mocks[name];
      mod = new vm.SyntheticModule(Object.keys(values), function () {
        for (const [key, value] of Object.entries(values)) this.setExport(key, value);
      }, { context, identifier: name });
    } else {
      let source = await readFile(new URL(name, base), 'utf8');
      if (name.includes('/Permissions/')) source = transformSync(source, {
        filename: name, configFile: false, babelrc: false,
        plugins: ['@babel/plugin-transform-react-jsx'],
      }).code;
      mod = new vm.SourceTextModule(source, { context, identifier: name });
    }
    cache.set(name, mod);
    await mod.link((specifier, parent) => {
      if (!specifier.startsWith('.')) return load(specifier);
      let resolved = new URL(specifier, new URL(parent.identifier, base)).href.slice(base.href.length);
      if (!resolved.endsWith('.js')) resolved += '.js';
      return load(resolved);
    });
    return mod;
  }
  async function namespace(name) {
    const mod = await load(name);
    if (mod.status !== 'evaluated') await mod.evaluate();
    return mod.namespace;
  }
  const token = (await namespace('src/api/tokenStorage.js')).tokenStorage;
  await token.setToken('usuario-A');
  const consent = await namespace('src/api/consentimento.js');
  const service = await namespace('src/services/tempoUsoSyncService.js');
  return { state, token, consent, service, namespace };
}

async function settle() {
  // Drena promessas sem sleeps/rede; inclui todas as janelas do service real.
  for (let i = 0; i < 100; i++) await new Promise(resolve => setImmediate(resolve));
}

for (const consentimento of [null, false]) test(`consentimento ${consentimento}: não coleta nem envia`, async () => {
  const { state, service } = await ambiente({ consentimento });
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'consentimento_inativo');
  assert.equal(state.coletas.length, 0);
  assert.equal(state.puts.length, 0);
});

test('sem autenticação não consulta consentimento nem coleta', async () => {
  const { state, token, service } = await ambiente();
  await token.clearToken();
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'sem_token');
  assert.equal(state.gets.length, 0);
  assert.equal(state.coletas.length, 0);
});

test('sem Usage Access não coleta', async () => {
  const { state, service } = await ambiente({ permission: false });
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'usage_access_nao_concedido');
  assert.equal(state.coletas.length, 0);
});

test('consentimento é consultado novamente após catálogo e antes da coleta', async () => {
  const { state, service } = await ambiente();
  state.get = async path => { if (path === '/tempo-uso/aplicativos') state.consentimento = false; };
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'consentimento_inativo');
  assert.equal(state.coletas.length, 0);
});

test('revogação remota durante coleta descarta resultado e impede próxima janela', async () => {
  const { state, service } = await ambiente();
  state.native = async () => { state.consentimento = false; return [{ packageName: 'com.shopee.br', durationSeconds: 5 }]; };
  const result = await service.sincronizarTempoUsoDoDia();
  assert.equal(result.motivo, 'consentimento_inativo');
  assert.equal(state.coletas.length, 1);
  assert.equal(result.quantidade, undefined);
  assert.equal(state.puts.length, 0);
});

test('revogação local aborta HTTP pendente antes de sua confirmação', async () => {
  const { state, service, consent } = await ambiente();
  const gate = deferred();
  let request;
  state.get = async (path, config) => {
    if (path === '/consentimento') { request = config; await gate.promise; }
  };
  const running = service.sincronizarTempoUsoDoDia();
  await settle();
  const postGate = deferred();
  state.post = () => postGate.promise;
  const revoke = consent.registrarConsentimento('MONITORAMENTO_TEMPO_USO', false);
  await settle();
  assert.equal(request.signal.aborted, true);
  gate.resolve();
  assert.equal((await running).motivo, 'consentimento_alterado');
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'consentimento_em_alteracao');
  assert.equal(state.coletas.length, 0);
  postGate.resolve();
  await revoke;
});

test('revogação local durante Kotlin descarta retorno sem iniciar outra coleta', async () => {
  const { state, service, consent } = await ambiente();
  const native = deferred();
  state.native = () => native.promise;
  const running = service.sincronizarTempoUsoDoDia();
  await settle();
  await consent.registrarConsentimento('MONITORAMENTO_TEMPO_USO', false);
  native.resolve([{ packageName: 'com.shopee.br', durationSeconds: 5 }]);
  assert.equal((await running).motivo, 'consentimento_alterado');
  assert.equal(state.coletas.length, 1);
  assert.equal(state.puts.length, 0);
});

for (const troca of [false, true]) test(`${troca ? 'troca de usuário' : 'logout'} cancela coleta pendente`, async () => {
  const { state, service, token } = await ambiente();
  const gate = deferred();
  state.native = () => gate.promise;
  const running = service.sincronizarTempoUsoDoDia();
  await settle();
  const config = state.gets[0].config;
  await (troca ? token.setToken('usuario-B') : token.clearToken());
  assert.equal(config.signal.aborted, true);
  gate.resolve([]);
  assert.equal((await running).motivo, 'sessao_invalidada');
  assert.equal(state.coletas.length, 1);
  assert.equal(state.puts.length, 0);
});

test('cooldown é isolado por sessão e não usa chave persistida de outro usuário', async () => {
  const { state, service, token } = await ambiente();
  state.storage.set('@plenna:tempoUsoUltimoSync', String(Date.now()));
  const first = await service.sincronizarTempoUsoDoDia();
  assert.equal(first.motivo, 'envio_bloqueado_no_laboratorio');
  assert.equal(state.coletas.length, 3);
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'cooldown_ativo');
  await token.setToken('usuario-B');
  await service.sincronizarTempoUsoDoDia();
  assert.equal(state.coletas.length, 6);
  state.consentimento = false;
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'consentimento_inativo');
  assert.equal(state.puts.length, 0);
});

test('execuções concorrentes compartilham uma única preparação', async () => {
  const { state, service } = await ambiente();
  const results = await Promise.all(Array.from({ length: 5 }, () => service.sincronizarTempoUsoDoDia()));
  assert.equal(state.coletas.length, 3);
  assert.ok(results.every(result => result.motivo === 'envio_bloqueado_no_laboratorio'));
  assert.equal(state.puts.length, 0);
});

test('nova conta aguarda consulta nativa antiga terminar antes de coletar', async () => {
  const { state, service, token } = await ambiente();
  const gate = deferred();
  state.native = () => gate.promise;
  const old = service.sincronizarTempoUsoDoDia();
  await settle();
  await token.setToken('usuario-B');
  const next = service.sincronizarTempoUsoDoDia();
  await settle();
  assert.equal(state.coletas.length, 1);
  state.native = null;
  gate.resolve([]);
  assert.equal((await old).motivo, 'sessao_invalidada');
  assert.equal((await next).motivo, 'envio_bloqueado_no_laboratorio');
  assert.equal(state.coletas.length, 4);
});

test('falha ao consultar consentimento impede coleta', async () => {
  const { state, service } = await ambiente();
  state.get = async () => { throw new Error('offline'); };
  await assert.rejects(service.sincronizarTempoUsoDoDia(), /offline/);
  assert.equal(state.coletas.length, 0);
});

test('sinal já cancelado não inicia operação', async () => {
  const { state, service } = await ambiente();
  const controller = new AbortController();
  controller.abort();
  assert.equal((await service.sincronizarTempoUsoDoDia(undefined, { signal: controller.signal })).motivo, 'operacao_cancelada');
  assert.equal(state.coletas.length, 0);
  assert.equal(state.gets.length, 0);
});

test('Usage Access removido durante coleta descarta o resultado', async () => {
  const { state, service } = await ambiente();
  state.native = async () => {
    state.permission = false;
    return [{ packageName: 'com.shopee.br', durationSeconds: 5 }];
  };
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'usage_access_nao_concedido');
  assert.equal(state.coletas.length, 1);
  assert.equal(state.puts.length, 0);
});

test('falha da revogação libera apenas estado transitório e volta a consultar a API', async () => {
  const { state, service, consent } = await ambiente();
  state.post = async () => { throw new Error('offline'); };
  await assert.rejects(consent.registrarConsentimento('MONITORAMENTO_TEMPO_USO', false), /offline/);
  // O servidor ainda autoriza: não há um segundo cadastro local de consentimento.
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'envio_bloqueado_no_laboratorio');
  assert.equal(state.coletas.length, 3);
  assert.ok(state.gets.some(item => item.path === '/consentimento'));
});

test('confirmação de consentimento da conta antiga não altera a conta nova', async () => {
  const { state, token, consent } = await ambiente();
  const sessao = await token.captureSession();
  await token.setToken('usuario-B');
  await assert.rejects(consent.registrarConsentimento('MONITORAMENTO_TEMPO_USO', false, {
    rf017SessionId: sessao.id,
  }), error => error.code === 'RF017_SESSION_INVALIDATED');
  assert.equal(state.posts.length, 0);
});

test('concessão após revogação invalida cooldown e revalida autorização', async () => {
  const { state, service, consent } = await ambiente();
  await service.sincronizarTempoUsoDoDia();
  assert.equal(state.coletas.length, 3);
  await consent.registrarConsentimento('MONITORAMENTO_TEMPO_USO', false);
  assert.equal((await service.sincronizarTempoUsoDoDia()).motivo, 'consentimento_inativo');
  await consent.registrarConsentimento('MONITORAMENTO_TEMPO_USO', true);
  await service.sincronizarTempoUsoDoDia();
  assert.equal(state.coletas.length, 6);
  assert.equal(state.puts.length, 0);
});

test('hook inicial/foreground respeita consentimento, permissão, sessão e concorrência', async () => {
  const { state, namespace, token } = await ambiente({ consentimento: false });
  const hook = await namespace('src/hooks/useTempoUsoSync.js');
  hook.useTempoUsoSync();
  const cleanup = state.effects[0]();
  await settle();
  assert.equal(state.coletas.length, 0);
  state.consentimento = true;
  state.permission = false;
  state.foreground();
  await settle();
  assert.equal(state.coletas.length, 0);
  state.permission = true;
  state.foreground();
  state.foreground();
  await settle();
  assert.equal(state.coletas.length, 3);
  state.consentimento = false;
  state.foreground();
  await settle();
  assert.equal(state.coletas.length, 3);
  await token.clearToken();
  state.foreground();
  await settle();
  assert.equal(state.coletas.length, 3);
  assert.equal(state.puts.length, 0);
  cleanup();
  assert.equal(state.listeners.size, 0);
});

test('desmontagem do hook cancela resultado nativo pendente', async () => {
  const { state, namespace } = await ambiente();
  const gate = deferred();
  state.native = () => gate.promise;
  (await namespace('src/hooks/useTempoUsoSync.js')).useTempoUsoSync();
  const cleanup = state.effects[0]();
  await settle();
  cleanup();
  assert.equal(state.gets[0].config.signal.aborted, true);
  gate.resolve([]);
  await settle();
  assert.equal(state.coletas.length, 1);
  assert.equal(state.listeners.size, 0);
});

test('Permissions mantém diagnóstico sem coleta e atualiza permissão ao retornar', async () => {
  const { state, namespace, token } = await ambiente({ consentimento: false, permission: false });
  const permissions = await namespace('src/components/ProfileComponents/Permissions/index.js');
  permissions.default({});
  const cleanup = state.effects[0]();
  await settle();
  assert.equal(state.states[1], false);
  assert.equal(state.states[2], false);
  state.permission = true;
  state.foreground();
  await settle();
  assert.equal(state.states[2], true);
  assert.equal(state.coletas.length, 0);
  await token.clearToken();
  assert.equal(state.states[1], false);
  assert.equal(state.states[2], false);
  cleanup();
});

for (const dev of [false, true]) test(`transporte continua sem PUT (__DEV__=${dev})`, async () => {
  const { state, namespace } = await ambiente({ dev });
  const api = await namespace('src/api/tempoUso.js');
  const result = await api.sincronizarTempoUso({ schemaVersion: 1, registros: [] });
  assert.equal(result.bloqueadoNoLaboratorio, true);
  assert.equal(result.persistidos, 0);
  assert.equal(state.puts.length, 0);
});
