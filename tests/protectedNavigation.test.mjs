import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderer } from './helpers/componentRenderer.mjs';

function navigationState(routeName) {
  return { index: 0, routes: [{ name: routeName }] };
}

test('área de compras preserva a sessão somente entre suas rotas protegidas', () => {
  const renderer = createRenderer();
  const area = renderer.load('src/services/security/protectedArea.js');

  assert.equal(area.isRouteInProtectedArea(area.PROTECTED_ACCESS_AREAS.PURCHASES, 'Purchases'), true);
  assert.equal(area.isRouteInProtectedArea(area.PROTECTED_ACCESS_AREAS.PURCHASES, 'Recurrences'), true);
  assert.equal(area.isRouteInProtectedArea(area.PROTECTED_ACCESS_AREAS.PURCHASES, 'Notifications'), false);
  assert.equal(area.isRouteInProtectedArea(area.PROTECTED_ACCESS_AREAS.PURCHASES, 'Home'), false);

  assert.equal(area.shouldPreserveProtectedSession(area.PROTECTED_ACCESS_AREAS.PURCHASES, { getState: () => navigationState('Recurrences') }), true);
  assert.equal(area.shouldPreserveProtectedSession(area.PROTECTED_ACCESS_AREAS.PURCHASES, { getState: () => navigationState('Purchases') }), true);
  assert.equal(area.shouldPreserveProtectedSession(area.PROTECTED_ACCESS_AREAS.PURCHASES, { getState: () => navigationState('App') }), false);
  assert.equal(area.shouldPreserveProtectedSession(area.PROTECTED_ACCESS_AREAS.PURCHASES, { getState: () => navigationState('Notifications') }), false);
});

test('sessão protegida é isolada por usuário e área', () => {
  const renderer = createRenderer({
    'react-native': {
      AppState: { addEventListener: () => ({ remove() {} }) },
    },
  });
  const session = renderer.load('src/services/security/protectedSession.js');

  session.invalidateProtectedSession();
  assert.equal(session.unlockProtectedSession(7, 'purchases'), true);
  assert.equal(session.isProtectedSessionUnlocked(7, 'purchases'), true);
  assert.equal(session.isProtectedSessionUnlocked(7, 'notifications'), false);
  assert.equal(session.isProtectedSessionUnlocked(8, 'purchases'), false);

  session.unlockProtectedSession(7, 'notifications');
  assert.equal(session.isProtectedSessionUnlocked(7, 'notifications'), true);
  assert.equal(session.isProtectedSessionUnlocked(7, 'purchases'), false);
  session.invalidateProtectedSession();
  assert.equal(session.isProtectedSessionUnlocked(7, 'notifications'), false);
});

function createAccessHarness({ biometricSuccess = true, verifyResult = true } = {}) {
  const listeners = new Set();
  let biometricCalls = 0;
  const mocks = {
    'react-native': {
      AppState: {
        addEventListener: (_, callback) => {
          listeners.add(callback);
          return { remove: () => listeners.delete(callback) };
        },
      },
    },
    '../api/client': { apiClient: { get: async () => ({ data: { usuario_id: 7 } }) } },
    '../services/security/biometricService': {
      authenticateWithBiometrics: async () => {
        biometricCalls += 1;
        return { success: biometricSuccess };
      },
      cancelBiometricAuthentication: async () => undefined,
    },
    '../services/security/pinStorage': {
      getPinRecord: async () => ({ version: 1 }),
      savePin: async () => undefined,
      verifyPin: async () => verifyResult,
    },
  };
  const renderer = createRenderer(mocks);
  const session = renderer.load('src/services/security/protectedSession.js');
  mocks['../services/security/protectedSession'] = session;
  session.invalidateProtectedSession();
  const hookModule = renderer.load('src/hooks/useProtectedAccess.js');
  let access;
  function Harness() {
    access = hookModule.useProtectedAccess({ area: 'purchases' });
    return { type: 'View', props: { status: access.status } };
  }
  renderer.mount(Harness);
  return { renderer, access: () => access, listeners, biometricCalls: () => biometricCalls, session };
}

async function settle(renderer) {
  for (let index = 0; index < 4; index += 1) await renderer.flush();
}

test('desbloqueio é reutilizado entre telas da mesma área, mas não após saída', async () => {
  const harness = createAccessHarness();
  await harness.access().beginAccess();
  await settle(harness.renderer);
  assert.equal(harness.access().status, 'unlocked');
  assert.equal(harness.biometricCalls(), 1);

  harness.access().cancelAccess({ preserveSession: true });
  await settle(harness.renderer);
  assert.equal(harness.access().status, 'locked');
  await harness.access().beginAccess();
  await settle(harness.renderer);
  assert.equal(harness.access().status, 'unlocked');
  assert.equal(harness.biometricCalls(), 1);

  harness.access().cancelAccess();
  await settle(harness.renderer);
  await harness.access().beginAccess();
  await settle(harness.renderer);
  assert.equal(harness.access().status, 'unlocked');
  assert.equal(harness.biometricCalls(), 2);
  harness.renderer.unmount();
});

test('PIN incorreto e cancelamento não concedem acesso', async () => {
  const harness = createAccessHarness({ biometricSuccess: false, verifyResult: false });
  await harness.access().beginAccess();
  await settle(harness.renderer);
  assert.equal(harness.access().status, 'pin');

  await harness.access().submitPin('123456');
  await settle(harness.renderer);
  assert.equal(harness.access().status, 'pin');
  assert.match(harness.access().errorMessage, /PIN incorreto/);

  harness.access().cancelAccess();
  await settle(harness.renderer);
  assert.equal(harness.access().status, 'locked');
  assert.equal(harness.session.isProtectedSessionUnlocked(7, 'purchases'), false);
  harness.renderer.unmount();
});

test('segundo plano invalida a sessão protegida', async () => {
  const harness = createAccessHarness();
  await harness.access().beginAccess();
  await settle(harness.renderer);
  assert.equal(harness.access().status, 'unlocked');

  for (const listener of harness.listeners) listener('background');
  await settle(harness.renderer);
  assert.equal(harness.access().status, 'locked');
  assert.equal(harness.session.isProtectedSessionUnlocked(7, 'purchases'), false);
  harness.renderer.unmount();
});
