import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function createHarness({ permission = { status: 'granted', granted: true }, projectId = 'project-55', expoGoConfig = null, throwOnExpoNotifications = false } = {}) {
  const root = new URL('../', import.meta.url);
  const state = {
    permission,
    projectId,
    calls: [],
    apiCalls: [],
    storage: new Map(),
    alertCalls: [],
    notificationHandler: null,
    responseListener: null,
    responseRemoved: false,
    lastResponse: null,
    navigations: [],
    channelReady: false,
    token: 'ExpoPushToken[test-token]',
    tokenError: null,
    requiredModules: [],
  };

  const storage = {
    async getItem(key) {
      return state.storage.get(key) ?? null;
    },
    async setItem(key, value) {
      state.storage.set(key, value);
    },
    async removeItem(key) {
      state.storage.delete(key);
    },
  };

  const notifications = {
    AndroidImportance: { DEFAULT: 3 },
    async setNotificationChannelAsync(id, config) {
      state.calls.push({ name: 'channel', id, config });
      state.channelReady = true;
    },
    async getPermissionsAsync() {
      state.calls.push({ name: 'getPermissions' });
      return state.permission;
    },
    async requestPermissionsAsync() {
      state.calls.push({ name: 'requestPermissions' });
      return state.permissionAfterRequest ?? { status: 'granted', granted: true };
    },
    async getExpoPushTokenAsync(options) {
      state.calls.push({ name: 'getToken', options, channelReady: state.channelReady });
      if (state.tokenError) throw state.tokenError;
      return { data: state.token };
    },
    setNotificationHandler(handler) {
      state.calls.push({ name: 'setHandler' });
      state.notificationHandler = handler;
    },
    addNotificationResponseReceivedListener(listener) {
      state.responseListener = listener;
      return {
        remove() {
          state.responseRemoved = true;
        },
      };
    },
    async getLastNotificationResponseAsync() {
      return state.lastResponse;
    },
  };

  const api = {
    async post(url, data) {
      state.apiCalls.push({ method: 'post', url, data });
      return { data: { ok: true } };
    },
    async delete(url, config) {
      state.apiCalls.push({ method: 'delete', url, config });
      if (state.deleteError) throw state.deleteError;
      return { data: { ok: true } };
    },
  };

  const navigationRefFactory = () => ({
    ready: false,
    state: { routeNames: [] },
    isReady() {
      return this.ready;
    },
    getState() {
      return this.state;
    },
    navigate(...args) {
      state.navigations.push(args);
    },
  });

  const mocks = new Map([
    ['react-native', {
      Alert: {
        alert(...args) {
          state.alertCalls.push({ title: args[0], message: args[1], buttons: args[2], options: args[3] });
        },
      },
      Platform: { OS: 'android' },
    }],
    ['@react-native-async-storage/async-storage', { default: storage }],
    ['expo-notifications', notifications],
    ['expo-constants', { default: { expoConfig: { extra: { eas: { projectId } } }, easConfig: undefined, expoGoConfig } }],
    ['@react-navigation/native', { createNavigationContainerRef: navigationRefFactory }],
    [new URL('src/api/client.js', root).href, { apiClient: api }],
  ]);

  const context = vm.createContext({
    AbortController,
    Buffer,
    console,
    clearTimeout,
    setTimeout,
    require(specifier) {
      state.requiredModules.push(specifier);
      if (specifier === 'expo-notifications' && throwOnExpoNotifications) {
        throw new Error('expo-notifications SHOULD NOT LOAD IN EXPO GO');
      }
      if (!mocks.has(specifier)) throw new Error(`Unexpected runtime require: ${specifier}`);
      return mocks.get(specifier);
    },
  });
  const modules = new Map();
  const loading = new Map();

  function resolveSpecifier(specifier, parent) {
    if (!specifier.startsWith('.')) return specifier;
    const resolved = new URL(specifier, parent);
    return resolved.pathname.endsWith('.js') ? resolved.href : `${resolved.href}.js`;
  }

  async function load(identifier) {
    if (!loading.has(identifier)) loading.set(identifier, build(identifier));
    return loading.get(identifier);
  }

  async function build(identifier) {
    const mock = mocks.get(identifier);
    const module = mock
      ? new vm.SyntheticModule(Object.keys(mock), function setExports() {
        for (const [name, value] of Object.entries(mock)) this.setExport(name, value);
      }, { context, identifier })
      : new vm.SourceTextModule(await readFile(new URL(identifier), 'utf8'), { context, identifier });

    modules.set(identifier, module);
    await module.link((specifier, parent) => load(resolveSpecifier(specifier, parent.identifier)));
    return module;
  }

  const serviceId = new URL('src/services/notifications/notificationService.js', root).href;
  const service = await load(serviceId);
  await service.evaluate();

  const navigationId = new URL('src/services/notifications/notificationNavigation.js', root).href;
  const navigation = modules.get(navigationId).namespace;
  return { state, service: service.namespace, navigation };
}

async function createRegistrationHookHarness({ expoGoConfig = null, throwOnExpoNotifications = false } = {}) {
  const root = new URL('../', import.meta.url);
  const state = { registerCalls: [], listener: null, removed: false, cleanup: null };
  const mocks = new Map([
    ['react', {
      useRef(value) {
        return { current: value };
      },
      useEffect(effect) {
        state.cleanup = effect();
      },
    }],
    ['expo-notifications', {
      addPushTokenListener(listener) {
        state.listener = listener;
        return { remove() { state.removed = true; } };
      },
    }],
    ['expo-constants', { default: { expoConfig: {}, easConfig: undefined, expoGoConfig } }],
    [new URL('src/services/notifications/notificationService.js', root).href, {
      isExpoGo() {
        return expoGoConfig != null;
      },
      async registerAuthenticatedDevice(options) {
        state.registerCalls.push(options);
        return { status: 'registered' };
      },
    }],
  ]);
  const context = vm.createContext({
    console,
    require(specifier) {
      if (specifier === 'expo-notifications' && throwOnExpoNotifications) {
        throw new Error('expo-notifications SHOULD NOT LOAD IN EXPO GO');
      }
      if (!mocks.has(specifier)) throw new Error(`Unexpected runtime require: ${specifier}`);
      return mocks.get(specifier);
    },
  });
  const modules = new Map();
  const loading = new Map();
  function resolveSpecifier(specifier, parent) {
    if (!specifier.startsWith('.')) return specifier;
    const resolved = new URL(specifier, parent);
    return resolved.pathname.endsWith('.js') ? resolved.href : `${resolved.href}.js`;
  }
  async function load(identifier) {
    if (!loading.has(identifier)) loading.set(identifier, build(identifier));
    return loading.get(identifier);
  }
  async function build(identifier) {
    const mock = mocks.get(identifier);
    const module = mock
      ? new vm.SyntheticModule(Object.keys(mock), function setExports() {
        for (const [name, value] of Object.entries(mock)) this.setExport(name, value);
      }, { context, identifier })
      : new vm.SourceTextModule(await readFile(new URL(identifier), 'utf8'), { context, identifier });
    modules.set(identifier, module);
    await module.link((specifier, parent) => load(resolveSpecifier(specifier, parent.identifier)));
    return module;
  }
  const hookId = new URL('src/hooks/useNotificationRegistration.js', root).href;
  const hook = await load(hookId);
  await hook.evaluate();
  hook.namespace.useNotificationRegistration();
  await new Promise((resolve) => setImmediate(resolve));
  return { state };
}

function granted() {
  return { status: 'granted', granted: true };
}

function undetermined() {
  return { status: 'undetermined', granted: false };
}

test('permission granted cria canal antes do token e registra somente android', async () => {
  const { state, service } = await createHarness({ permission: granted() });

  const result = await service.registerAuthenticatedDevice();

  assert.equal(result.status, 'registered');
  assert.deepEqual(state.calls.map((call) => call.name), ['channel', 'getPermissions', 'getToken']);
  assert.equal(state.calls[0].id, 'plenna-alerts');
  assert.equal(state.calls[0].config.name, 'Alertas Plenna');
  assert.equal(state.calls[0].config.importance, 3);
  assert.equal(state.calls[0].config.sound, null);
  assert.equal(state.calls[0].config.showBadge, false);
  assert.equal(JSON.stringify(state.calls[2].options), JSON.stringify({ projectId: 'project-55' }));
  assert.equal(JSON.stringify(state.apiCalls[0]), JSON.stringify({
    method: 'post',
    url: '/devices/push',
    data: { pushToken: 'ExpoPushToken[test-token]', platform: 'android' },
  }));
  assert.equal('userId' in state.apiCalls[0].data, false);
});

test('permission granted não mostra prompt nem solicita novamente', async () => {
  const { state, service } = await createHarness({ permission: granted() });

  await service.registerAuthenticatedDevice();

  assert.equal(state.alertCalls.length, 0);
  assert.equal(state.calls.filter((call) => call.name === 'requestPermissions').length, 0);
});

test('permissão indeterminada exibe contexto e opção Ativar chama prompt do sistema', async () => {
  const { state, service } = await createHarness({ permission: undetermined() });
  state.permissionAfterRequest = granted();

  const registration = service.registerAuthenticatedDevice();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.alertCalls.length, 1);
  assert.match(state.alertCalls[0].message, /planejamento de gastos/);
  state.alertCalls[0].buttons[1].onPress();

  assert.equal((await registration).status, 'registered');
  assert.equal(state.calls.filter((call) => call.name === 'requestPermissions').length, 1);
});

test('Agora não marca o prompt e não insiste na abertura seguinte', async () => {
  const { state, service } = await createHarness({ permission: undetermined() });

  const first = service.registerAuthenticatedDevice();
  await new Promise((resolve) => setImmediate(resolve));
  state.alertCalls[0].buttons[0].onPress();
  assert.equal((await first).status, 'prompt-declined');

  const second = await service.registerAuthenticatedDevice();
  assert.equal(second.status, 'prompt-skipped');
  assert.equal(state.alertCalls.length, 1);
  assert.equal(state.calls.filter((call) => call.name === 'requestPermissions').length, 0);
});

test('permissão negada mantém o app funcionando sem obter token', async () => {
  const { state, service } = await createHarness({ permission: { status: 'denied', granted: false } });

  const result = await service.registerAuthenticatedDevice();

  assert.equal(result.status, 'permission-denied');
  assert.equal(state.apiCalls.length, 0);
  assert.equal(state.calls.some((call) => call.name === 'getToken'), false);
});

test('permissão posteriormente granted registra mesmo com prompt local já marcado', async () => {
  const { state, service } = await createHarness({ permission: granted() });
  state.storage.set('@plenna:notificationPermissionPrompted', 'true');

  const result = await service.registerAuthenticatedDevice();

  assert.equal(result.status, 'registered');
  assert.equal(state.alertCalls.length, 0);
  assert.equal(state.apiCalls[0].url, '/devices/push');
});

test('projectId ausente retorna falha controlada sem crashar', async () => {
  const { state, service } = await createHarness({ permission: granted(), projectId: undefined });

  const result = await service.registerAuthenticatedDevice({
    constants: { expoConfig: undefined, easConfig: undefined },
  });

  assert.equal(result.status, 'missing-project-id');
  assert.equal(state.apiCalls.length, 0);
});

test('Expo Go é detectado por expoGoConfig e development build não é confundido', async () => {
  const { service } = await createHarness({ expoGoConfig: {} });
  assert.equal(service.isExpoGo({ expoGoConfig: {} }), true);
  assert.equal(service.isExpoGo({ expoGoConfig: null, executionEnvironment: 'storeClient' }), false);
  assert.equal(service.isExpoGo({ expoGoConfig: undefined, executionEnvironment: 'standalone' }), false);
});

test('Expo Go não chama APIs de remote push nem backend no service', async () => {
  const { state, service } = await createHarness({ permission: granted(), expoGoConfig: {} });

  const result = await service.registerAuthenticatedDevice();

  assert.equal(result.status, 'expo-go-unsupported');
  assert.equal(state.calls.length, 0);
  assert.equal(state.apiCalls.length, 0);
});

test('Expo Go importa o notificationService sem carregar expo-notifications', async () => {
  const { state, service } = await createHarness({ expoGoConfig: {}, throwOnExpoNotifications: true });

  assert.equal(service.configureForegroundNotificationHandler(), false);
  const cleanup = service.setupNotificationResponseHandling();
  cleanup();
  assert.deepEqual(state.requiredModules, []);
});

test('fallback easConfig é aceito para resolver projectId', async () => {
  const { state, service } = await createHarness({ permission: granted() });

  const result = await service.registerAuthenticatedDevice({
    constants: { expoConfig: undefined, easConfig: { projectId: 'fallback-project' } },
  });

  assert.equal(result.status, 'registered');
  assert.equal(JSON.stringify(state.calls.find((call) => call.name === 'getToken').options), JSON.stringify({ projectId: 'fallback-project' }));
});

test('falha na obtenção do ExpoPushToken é controlada e não derruba login', async () => {
  const { state, service } = await createHarness({ permission: granted() });
  state.tokenError = new Error('network failure');

  const result = await service.registerAuthenticatedDevice();

  assert.equal(result.status, 'registration-failed');
  assert.equal(state.apiCalls.length, 0);
});

test('token vazio é tratado como indisponível', async () => {
  const { state, service } = await createHarness({ permission: granted() });
  state.token = '';

  const result = await service.registerAuthenticatedDevice();

  assert.equal(result.status, 'token-unavailable');
  assert.equal(state.apiCalls.length, 0);
});

test('permissão indeterminada sem prompt permite rechecagem futura sem pedir sistema', async () => {
  const { state, service } = await createHarness({ permission: undetermined() });

  const result = await service.registerAuthenticatedDevice({ requestPermission: false });

  assert.equal(result.status, 'permission-undetermined');
  assert.equal(state.alertCalls.length, 0);
  assert.equal(state.calls.some((call) => call.name === 'getToken'), false);
});

test('plataforma diferente de Android não tenta registrar push Android', async () => {
  const { state, service } = await createHarness({ permission: granted() });

  const result = await service.registerAuthenticatedDevice({ platform: 'ios' });

  assert.equal(result.status, 'unsupported-platform');
  assert.equal(state.calls.length, 0);
  assert.equal(state.apiCalls.length, 0);
});

test('falha no registro backend é controlada sem apagar sessão', async () => {
  const { state, service } = await createHarness({ permission: granted() });
  const api = {
    async post() { throw new Error('offline'); },
  };

  const result = await service.registerAuthenticatedDevice({ api });

  assert.equal(result.status, 'registration-failed');
  assert.equal(state.storage.has('@plenna:expoPushToken'), false);
});

test('reassociação de conta pode reenviar o mesmo token sem skip local por usuário', async () => {
  const { state, service } = await createHarness({ permission: granted() });

  await service.registerAuthenticatedDevice();
  await service.registerAuthenticatedDevice();

  assert.equal(state.apiCalls.filter((call) => call.url === '/devices/push').length, 2);
});

test('disable envia pushToken antes de limpar o storage local', async () => {
  const { state, service } = await createHarness();
  state.storage.set('@plenna:expoPushToken', 'ExpoPushToken[logout]');

  const result = await service.disableRegisteredDevice();

  assert.equal(result.status, 'disabled');
  assert.equal(JSON.stringify(state.apiCalls[0]), JSON.stringify({
    method: 'delete',
    url: '/devices/push/current',
    config: { data: { pushToken: 'ExpoPushToken[logout]' } },
  }));
  assert.equal(state.storage.has('@plenna:expoPushToken'), false);
});

test('logout sem token não chama backend e segue normalmente', async () => {
  const { state, service } = await createHarness();

  const result = await service.disableRegisteredDevice();

  assert.equal(result.status, 'no-token');
  assert.equal(state.apiCalls.length, 0);
});

test('falha no disable não bloqueia logout e ainda limpa estado local', async () => {
  const { state, service } = await createHarness();
  state.storage.set('@plenna:expoPushToken', 'ExpoPushToken[logout-failure]');
  state.deleteError = new Error('offline');

  const result = await service.disableRegisteredDevice();

  assert.equal(result.status, 'disable-failed');
  assert.equal(state.storage.has('@plenna:expoPushToken'), false);
});

test('falha ao ler storage também não bloqueia logout', async () => {
  const { service } = await createHarness();
  const storage = {
    async getExpoPushToken() { throw new Error('storage unavailable'); },
    async clearExpoPushToken() {},
  };

  const result = await service.disableRegisteredDevice({ storage });

  assert.equal(result.status, 'disable-failed');
});

test('foreground handler é explícito e configurado uma única vez', async () => {
  const { state, service } = await createHarness();

  assert.equal(service.configureForegroundNotificationHandler(), true);
  assert.equal(service.configureForegroundNotificationHandler(), false);
  assert.equal(state.calls.filter((call) => call.name === 'setHandler').length, 1);
  assert.equal(JSON.stringify(await state.notificationHandler.handle()), JSON.stringify({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }));
});

test('response válida extrai somente notificationId e type esperados', async () => {
  const { navigation } = await createHarness();
  const response = {
    notification: {
      request: {
        content: { data: { notificationId: '42', type: 'SAZONAL', secret: 'ignored' } },
      },
    },
  };

  assert.equal(JSON.stringify(navigation.extractNotificationIntent(response)), JSON.stringify({ notificationId: 42, type: 'SAZONAL' }));
  assert.equal(navigation.extractNotificationIntent({ notification: { request: { content: { data: { notificationId: 0, type: 'SAZONAL' } } } } }), null);
  assert.equal(navigation.extractNotificationIntent({ notification: { request: { content: { data: { notificationId: 42, type: 'UNKNOWN' } } } } }), null);
  assert.equal(navigation.extractNotificationIntent({}), null);
});

test('rota ausente guarda pending intent e rota futura pode consumi-lo', async () => {
  const { navigation } = await createHarness();
  const nav = {
    ready: true,
    state: { routeNames: ['App', 'Login'] },
    isReady() { return this.ready; },
    getState() { return this.state; },
    navigate(...args) { this.lastNavigation = args; },
  };
  const intent = { notificationId: 7, type: 'LIMITE_MENSAL' };

  assert.equal(navigation.deliverNotificationIntent(intent, nav), false);
  assert.deepEqual(navigation.getPendingNotificationIntent(), intent);
  nav.state.routeNames.push('Notifications');
  assert.deepEqual(navigation.consumePendingNotificationIntent(nav), intent);
  assert.deepEqual(nav.lastNavigation, ['Notifications', intent]);
  assert.equal(navigation.getPendingNotificationIntent(), null);
});

test('response listener e cold start processam a mesma interação no máximo uma vez', async () => {
  const { state, service, navigation } = await createHarness();
  const nav = {
    ready: true,
    state: { routeNames: [] },
    isReady() { return this.ready; },
    getState() { return this.state; },
    navigate() { throw new Error('rota inexistente não deve ser chamada'); },
  };
  const response = {
    notification: {
      request: {
        identifier: 'response-1',
        content: { data: { notificationId: 9, type: 'LIMITE_COMPRA' } },
      },
    },
  };
  state.lastResponse = response;

  const cleanup = service.setupNotificationResponseHandling({ navigation: nav });
  state.responseListener(response);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(JSON.stringify(navigation.getPendingNotificationIntent()), JSON.stringify({ notificationId: 9, type: 'LIMITE_COMPRA' }));
  cleanup();
  assert.equal(state.responseRemoved, true);
});

test('payload inválido é ignorado sem navegação', async () => {
  const { state, service, navigation } = await createHarness();
  const nav = {
    ready: true,
    state: { routeNames: ['Notifications'] },
    isReady() { return this.ready; },
    getState() { return this.state; },
    navigate(...args) { state.navigations.push(args); },
  };

  const cleanup = service.setupNotificationResponseHandling({ navigation: nav });
  state.responseListener({ notification: { request: { content: { data: { notificationId: 'bad', type: 'SAZONAL' } } } } });
  await new Promise((resolve) => setImmediate(resolve));
  cleanup();

  assert.equal(state.navigations.length, 0);
  assert.equal(navigation.getPendingNotificationIntent(), null);
});

test('listener de token nativo valida o evento e reobtém ExpoPushToken', async () => {
  const { state } = await createRegistrationHookHarness();

  assert.equal(state.registerCalls.length, 1);
  assert.equal(state.registerCalls[0].requestPermission, true);
  state.listener({ data: 123 });
  state.listener({ data: 'native-token' });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(state.registerCalls.length, 2);
  assert.equal(state.registerCalls[1].requestPermission, false);
  state.cleanup();
  assert.equal(state.removed, true);
});

test('Expo Go monta o hook sem registrar token nem listener remoto', async () => {
  const { state } = await createRegistrationHookHarness({ expoGoConfig: {} });

  assert.equal(state.registerCalls.length, 0);
  assert.equal(state.listener, null);
  assert.equal(state.cleanup, undefined);
});

test('Expo Go importa e monta o hook sem carregar expo-notifications', async () => {
  const { state } = await createRegistrationHookHarness({ expoGoConfig: {}, throwOnExpoNotifications: true });

  assert.equal(state.listener, null);
  assert.equal(state.registerCalls.length, 0);
});

test('todas as categorias financeiras e sazonal são aceitas no tap', async () => {
  const { navigation } = await createHarness();
  for (const type of ['LIMITE_COMPRA', 'LIMITE_CATEGORIA', 'LIMITE_MENSAL', 'SAZONAL']) {
    assert.equal(navigation.extractNotificationIntent({ notification: { request: { content: { data: { notificationId: 1, type } } } } }).type, type);
  }
});

test('pending intent não é entregue duas vezes', async () => {
  const { navigation } = await createHarness();
  const nav = {
    ready: true,
    state: { routeNames: [] },
    isReady() { return this.ready; },
    getState() { return this.state; },
    navigate() {},
  };
  navigation.deliverNotificationIntent({ notificationId: 8, type: 'SAZONAL' }, nav);
  nav.state.routeNames.push('Central');
  assert.ok(navigation.consumePendingNotificationIntent(nav));
  assert.equal(navigation.consumePendingNotificationIntent(nav), null);
});

test('configuração preserva OAuth e usa navigation ref separado', async () => {
  const app = await readFile(new URL('../App.js', import.meta.url), 'utf8');
  const routes = await readFile(new URL('../src/routes.js', import.meta.url), 'utf8');
  const profile = await readFile(new URL('../src/pages/ProfileScreen/index.js', import.meta.url), 'utf8');
  const serviceSource = await readFile(new URL('../src/services/notifications/notificationService.js', import.meta.url), 'utf8');
  const runtimeSource = await readFile(new URL('../src/services/notifications/expoNotificationsRuntime.js', import.meta.url), 'utf8');
  const hookSource = await readFile(new URL('../src/hooks/useNotificationRegistration.js', import.meta.url), 'utf8');
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const appConfig = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8'));
  assert.match(appConfig.expo.scheme, /^plenna$/);
  assert.match(routes, /ref=\{notificationNavigationRef\}/);
  assert.match(app, /setupNotificationResponseHandling/);
  assert.doesNotMatch(app, /from ['"]expo-notifications['"]/);
  assert.ok(profile.indexOf('await disableRegisteredDevice()') < profile.indexOf('await tokenStorage.clearToken()'));
  assert.equal(packageJson.scripts.start, 'expo start --go');
  assert.equal(packageJson.scripts['start:dev'], 'expo start --dev-client');
  assert.match(serviceSource, /import Constants from 'expo-constants';/);
  assert.doesNotMatch(serviceSource, /import \* as Constants from 'expo-constants'/);
  assert.doesNotMatch(serviceSource, /from ['"]expo-notifications['"]/);
  assert.doesNotMatch(hookSource, /from ['"]expo-notifications['"]/);
  assert.match(runtimeSource, /return require\('expo-notifications'\)/);
  assert.match(runtimeSource, /if \(isExpoGo\(constants\)\) return null/);
  assert.equal((hookSource.match(/Notifications\.addPushTokenListener/g) ?? []).length, 1);
  assert.ok(hookSource.indexOf('if (isExpoGo())') < hookSource.indexOf('getExpoNotifications()'));
  assert.ok(hookSource.indexOf('getExpoNotifications()') < hookSource.indexOf('Notifications.addPushTokenListener'));
  assert.equal((serviceSource.match(/Notifications\.addPushTokenListener/g) ?? []).length, 0);
});

test('produção não imprime ExpoPushToken', async () => {
  const source = await readFile(new URL('../src/services/notifications/notificationService.js', import.meta.url), 'utf8');
  assert.equal(/console\.(log|warn|error).*token/i.test(source), false);
  assert.equal(/console\.(log|warn|error).*ExpoPushToken/i.test(source), false);
});
