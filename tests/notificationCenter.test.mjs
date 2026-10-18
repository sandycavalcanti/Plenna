import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);

async function loadModule(relativePath, mocks = {}) {
  const context = vm.createContext({ console, Intl });
  const modules = new Map();
  const loading = new Map();
  const mockEntries = new Map(Object.entries(mocks));

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
    const mock = mockEntries.get(identifier);
    const module = mock
      ? new vm.SyntheticModule(Object.keys(mock), function setExports() {
        for (const [name, value] of Object.entries(mock)) this.setExport(name, value);
      }, { context, identifier })
      : new vm.SourceTextModule(await readFile(new URL(identifier), 'utf8'), { context, identifier });

    modules.set(identifier, module);
    await module.link((specifier, parent) => load(resolveSpecifier(specifier, parent.identifier)));
    return module;
  }

  const module = await load(new URL(relativePath, root).href);
  await module.evaluate();
  return module.namespace;
}

test('notificationApi usa os endpoints autenticados esperados', async () => {
  const calls = [];
  const backendNotifications = [
    {
      notificacao_id: 12,
      notificacao_tipo: 'LIMITE_MENSAL',
      notificacao_titulo: 'Planejamento mensal',
      notificacao_mensagem: 'Seu orçamento mensal merece atenção.',
      compra_id: 101,
      categoria_id: null,
      notificacao_evento: null,
      notificacao_lida: 0,
      notificacao_lida_em: null,
      notificacao_data_criacao: '2026-10-04T19:30:00.000Z',
    },
    {
      notificacao_id: 11,
      notificacao_tipo: 'SAZONAL',
      notificacao_titulo: 'Planeje suas compras',
      notificacao_mensagem: 'Compare opções antes de comprar.',
      compra_id: null,
      categoria_id: null,
      notificacao_evento: 'BLACK_FRIDAY',
      notificacao_lida: 1,
      notificacao_lida_em: '2026-10-01T12:00:00.000Z',
      notificacao_data_criacao: '2026-10-03T19:30:00.000Z',
    },
  ];
  const apiClient = {
    async get(url) {
      calls.push({ method: 'get', url });
      if (url === '/notifications') return { data: backendNotifications };
      return { data: { count: 4 } };
    },
    async patch(url) {
      calls.push({ method: 'patch', url });
      return { data: { notificacao_id: 1, notificacao_lida: 1, notificacao_lida_em: '2026-10-04T19:30:00Z' } };
    },
  };
  const api = await loadModule('src/services/notifications/notificationApi.js', {
    [new URL('src/api/client.js', root).href]: { apiClient },
  });

  const receivedNotifications = await api.getNotifications();
  assert.deepEqual(receivedNotifications, backendNotifications);
  assert.deepEqual(receivedNotifications.map((item) => item.notificacao_id), [12, 11]);
  const presentation = await loadModule('src/services/notifications/notificationPresentation.js');
  const seasonal = receivedNotifications[1];
  assert.equal(seasonal.notificacao_tipo, 'SAZONAL');
  assert.equal(seasonal.compra_id, null);
  assert.equal(seasonal.categoria_id, null);
  assert.equal(presentation.getNotificationPresentation(seasonal.notificacao_tipo).label, 'Alerta sazonal');
  assert.equal(await api.getUnreadCount(), 4);
  assert.deepEqual(await api.markNotificationAsRead(1), {
    notificacao_id: 1,
    notificacao_lida: 1,
    notificacao_lida_em: '2026-10-04T19:30:00Z',
  });
  assert.deepEqual(calls, [
    { method: 'get', url: '/notifications' },
    { method: 'get', url: '/notifications/unread-count' },
    { method: 'patch', url: '/notifications/1/read' },
  ]);
});

test('notificationApi rejeita id inválido sem chamar o backend', async () => {
  let patchCalls = 0;
  const api = await loadModule('src/services/notifications/notificationApi.js', {
    [new URL('src/api/client.js', root).href]: {
      apiClient: { get: async () => ({ data: [] }), patch: async () => { patchCalls += 1; } },
    },
  });

  await assert.rejects(() => api.markNotificationAsRead('abc'), /Invalid notification id/);
  assert.equal(patchCalls, 0);
});

test('apresentação cobre data PT-BR, tipos, fallback, badge e leitura local', async () => {
  const presentation = await loadModule('src/services/notifications/notificationPresentation.js');

  assert.equal(presentation.getNotificationPresentation('LIMITE_MENSAL').label, 'Limite mensal');
  assert.equal(presentation.getNotificationPresentation('LIMITE_COMPRA').icon, 'wallet-outline');
  assert.equal(presentation.getNotificationPresentation('LIMITE_MENSAL').icon, 'chart-line');
  assert.equal(presentation.getNotificationPresentation('SAZONAL').icon, 'calendar-star-outline');
  assert.ok(presentation.getNotificationPresentation('SAZONAL').iconColor);
  assert.ok(presentation.getNotificationPresentation('SAZONAL').iconBackgroundColor);
  assert.equal(presentation.getNotificationPresentation('UNKNOWN').icon, 'bell-outline');
  assert.match(presentation.formatNotificationDate('2026-10-04T22:30:00Z'), /2026/);
  assert.equal(presentation.formatNotificationDate('invalid'), 'Data indisponível');
  assert.equal(presentation.getUnreadBadgeLabel(0), null);
  assert.equal(presentation.getUnreadBadgeLabel(3), '3');
  assert.equal(presentation.getUnreadBadgeLabel(100), '99+');

  const notifications = [{ notificacao_id: 7, notificacao_lida: 0 }];
  assert.equal(presentation.isNotificationUnread(notifications[0]), true);
  assert.equal(JSON.stringify(presentation.markNotificationAsReadLocally(notifications, 7, 'now')), JSON.stringify([{
    notificacao_id: 7,
    notificacao_lida: 1,
    notificacao_lida_em: 'now',
  }]));
});

test('Home integra contador, badge dinâmico, foco e navegação para Notifications', async () => {
  const source = await readFile(new URL('../src/pages/HomeScreen/index.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/pages/HomeScreen/styles.js', import.meta.url), 'utf8');

  assert.match(source, /getUnreadCount/);
  assert.match(source, /waitForPendingNotificationReads/);
  assert.match(source, /useFocusEffect/);
  assert.match(source, /refetchUnreadCount\(\)/);
  assert.match(source, /getParent\?\.\(\)/);
  assert.match(source, /navigate\('Notifications'\)/);
  assert.doesNotMatch(source, /onPress=\{\(\) => \{\}\}/);
  assert.match(source, /notificationBadge/);
  assert.match(source, /useIsFocused/);
  assert.match(source, /Animated\.loop/);
  assert.match(source, /Animated\.delay\(3000\)/);
  assert.match(source, /unreadCount > 0/);
  assert.match(styles, /notificationButtonPending/);
  assert.doesNotMatch(styles, /notificationDot/);
});

test('Central cobre estados, proteção, refresh, leitura e intent', async () => {
  const source = await readFile(new URL('../src/pages/NotificationsScreen/index.js', import.meta.url), 'utf8');
  const apiSource = await readFile(new URL('../src/services/notifications/notificationApi.js', import.meta.url), 'utf8');

  for (const expected of [
    'getNotifications',
    'markNotificationAsRead',
    'RefreshControl',
    'Carregando notificações',
    'Você ainda não possui notificações.',
    'Não foi possível carregar suas notificações.',
    'Tentar novamente',
    'useProtectedAccess',
    'PinModal',
    'notificationId',
    'notificacao_titulo',
    'notificacao_mensagem',
    'notificacao_data_criacao',
  ]) {
    assert.match(source, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(apiSource, /\/notifications\/unread-count/);
  assert.match(apiSource, /\/notifications\/\$\{encodeURIComponent\(notificationId\)\}\/read/);
  assert.match(apiSource, /waitForPendingNotificationReads/);
  assert.match(source, /markNotificationAsReadLocally/);
  assert.match(source, /unreadOnEntryRef/);
  assert.match(source, /markNotificationsReadOnBlur/);
  assert.match(source, /void markNotificationsReadOnBlur\(\)/);
  assert.match(source, /notificationsToRead\.map/);
  assert.match(source, /loadedNotifications\s*\.filter\(isNotificationUnread\)/);
  assert.doesNotMatch(source, /markLoadedUnreadNotifications/);
});

test('Stack e pending intent usam somente a rota Notifications', async () => {
  const routes = await readFile(new URL('../src/routes.js', import.meta.url), 'utf8');
  const navigation = await readFile(new URL('../src/services/notifications/notificationNavigation.js', import.meta.url), 'utf8');

  assert.match(routes, /name="Notifications"/);
  assert.match(routes, /component=\{NotificationsScreen\}/);
  assert.match(routes, /onReady=\{\(\) => consumePendingNotificationIntent/);
  assert.match(navigation, /const NOTIFICATION_ROUTE = 'Notifications'/);
  assert.doesNotMatch(navigation, /NotificationCenter|Central/);
});

test('OAuth, Expo Go e sessão protegida não recebem novo acoplamento de push', async () => {
  const app = await readFile(new URL('../App.js', import.meta.url), 'utf8');
  const home = await readFile(new URL('../src/pages/HomeScreen/index.js', import.meta.url), 'utf8');
  const central = await readFile(new URL('../src/pages/NotificationsScreen/index.js', import.meta.url), 'utf8');

  assert.match(app, /plena|configureForegroundNotificationHandler|setupNotificationResponseHandling/i);
  assert.doesNotMatch(home, /expo-notifications/);
  assert.doesNotMatch(central, /expo-notifications/);
  assert.match(central, /useProtectedAccess/);
  assert.match(central, /PROTECTED_ACCESS_STATES\.UNLOCKED/);
});
