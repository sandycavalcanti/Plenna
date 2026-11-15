import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderer } from './helpers/componentRenderer.mjs';

const settle = async renderer => {
  for (let index = 0; index < 8; index += 1) await renderer.flush();
};

async function mountEmailPermissions({ consent = false, connected = false, operational = connected, authorizationStatus = '', oauthResult = 'success', notificationPermission = { status: 'unavailable' }, notificationToken = null, notificationResult = { status: 'unavailable' } } = {}) {
  const state = {
    consent,
    connected,
    operational,
    oauthCalls: 0,
    registerCalls: [],
    failRegister: false,
    notificationPermission,
    notificationToken,
    notificationResult,
    notificationSettingsOpens: 0,
    notificationListeners: new Set(),
  };
  const session = { id: 1, signal: new AbortController().signal };
  const renderer = createRenderer({
    'react-native': {
      View: 'View', Text: 'Text', Switch: 'Switch', Pressable: 'Pressable',
      ActivityIndicator: 'ActivityIndicator',
      Linking: { openSettings: async () => { state.notificationSettingsOpens += 1; } },
      AppState: {
        addEventListener: (_, listener) => {
          state.notificationListeners.add(listener);
          return { remove: () => state.notificationListeners.delete(listener) };
        },
      },
      Alert: { alert: (...args) => renderer?.alerts.push(args) },
      StyleSheet: { create: value => value },
    },
    '../../../api/usageMonitoringPolicy': { usageMonitoringEnabled: false },
    '../../../api/tokenStorage': {
      tokenStorage: {
        captureSession: async () => session,
        assertSession: () => {},
      },
    },
    '../../../api/consentimento': {
      listarConsentimentos: async () => [
        { consentimento_tipo_codigo: 'EMAIL', consentimento_status: state.consent },
        { consentimento_tipo_codigo: 'MONITORAMENTO_TEMPO_USO', consentimento_status: false },
        { consentimento_tipo_codigo: 'IA_MEMORIA', consentimento_status: false },
        { consentimento_tipo_codigo: 'IA_PERSONALIZACAO', consentimento_status: false },
        { consentimento_tipo_codigo: 'IA_PROATIVIDADE', consentimento_status: false },
      ],
      registrarConsentimento: async (codigo, status) => {
        state.registerCalls.push({ codigo, status });
        if (state.failRegister) throw new Error('consentimento indisponivel');
        if (codigo === 'EMAIL') state.consent = status;
      },
    },
    '../../../api/email': {
      consultarStatusEmail: async () => ({
        connected: state.connected,
        credentialsStored: state.connected,
        authorizationStatus: state.authorizationStatus || (state.connected ? 'CREDENTIALS_STORED' : 'NOT_CONFIGURED'),
        operational: state.operational,
      }),
      iniciarConexaoEmail: async () => ({ url: 'https://accounts.google.com/oauth' }),
    },
    'expo-web-browser': {
      openAuthSessionAsync: async () => {
        state.oauthCalls += 1;
        state.connected = true;
        state.operational = true;
        if (oauthResult === 'success') state.consent = true;
        return { type: oauthResult };
      },
    },
    '../../../services/monitoramentoConsentService': { alterarConsentimentoMonitoramento: async () => ({}) },
    '../../../../modules/plenna-usage-stats': {
      getModuleStatus: async () => ({ available: true }),
      hasUsageAccess: async () => false,
      openUsageAccessSettings: async () => false,
    },
    '../../../constants/colors': { COLORS: {} },
    '../../../utils/error': { logApiErrors: () => {} },
    '../../../services/notifications/notificationStorage': {
      notificationStorage: { getExpoPushToken: async () => state.notificationToken },
    },
    '../../../services/notifications/notificationService': {
      getNotificationPermissionStatus: async () => state.notificationPermission,
      requestNotificationPermissionAndRegister: async () => {
        if (state.notificationResult.status === 'registered') {
          state.notificationPermission = { status: 'granted', canAskAgain: true };
          state.notificationToken = 'ExponentPushToken[test]';
        }
        return state.notificationResult;
      },
    },
    '@react-navigation/native': {
      useNavigation: () => ({ navigate() {} }),
      createNavigationContainerRef: () => ({ isReady: () => false }),
    },
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
  });
  state.authorizationStatus = authorizationStatus;
  renderer.mount(renderer.load('src/components/ProfileComponents/Permissions/index.js').default, {});
  await settle(renderer);
  const getSwitch = () => renderer.nodes(node => node.type === 'Switch' && node.props.accessibilityLabel === 'Captura via e-mail')[0];
  const getNotificationSwitch = () => renderer.nodes(node => node.type === 'Switch' && node.props.accessibilityLabel === 'Permitir notificações')[0];
  return { renderer, state, getSwitch, getNotificationSwitch };
}

test('captura via e-mail começa desativada sem Gmail operacional', async () => {
  const { getSwitch } = await mountEmailPermissions({ consent: true, connected: false, operational: false });
  assert.equal(getSwitch().props.value, false);
  assert.equal(getSwitch().props.disabled, false);
});

test('captura via e-mail só aparece ativa com integração e consentimento', async () => {
  const { getSwitch } = await mountEmailPermissions({ consent: true, connected: true, operational: true });
  assert.equal(getSwitch().props.value, true);
});

test('reconexão necessária não aparece como captura ativa', async () => {
  const { getSwitch } = await mountEmailPermissions({ consent: true, connected: true, operational: false, authorizationStatus: 'RECONNECT_REQUIRED' });
  assert.equal(getSwitch().props.value, false);
});

test('ativação conecta Gmail antes de registrar EMAIL=true', async () => {
  const { renderer, state, getSwitch } = await mountEmailPermissions();
  await getSwitch().props.onValueChange(true);
  await settle(renderer);
  assert.equal(state.oauthCalls, 1);
  assert.deepEqual(state.registerCalls, []);
  assert.equal(getSwitch().props.value, true);
});

test('cancelamento do OAuth não concede consentimento', async () => {
  const { renderer, state, getSwitch } = await mountEmailPermissions({ oauthResult: 'dismiss' });
  await getSwitch().props.onValueChange(true);
  await settle(renderer);
  assert.equal(state.oauthCalls, 1);
  assert.deepEqual(state.registerCalls, []);
  assert.equal(getSwitch().props.value, false);
});

test('desativação registra EMAIL=false e deixa a captura desligada', async () => {
  const { renderer, state, getSwitch } = await mountEmailPermissions({ consent: true, connected: true, operational: true });
  await getSwitch().props.onValueChange(false);
  const alert = renderer.alerts.at(-1);
  alert[2].find(option => option.text === 'Desativar').onPress();
  await settle(renderer);
  assert.deepEqual(state.registerCalls, [{ codigo: 'EMAIL', status: false }]);
  assert.equal(getSwitch().props.value, false);
});

test('falha ao registrar consentimento não simula ativação', async () => {
  const { renderer, state, getSwitch } = await mountEmailPermissions();
  state.connected = true;
  state.operational = true;
  state.failRegister = true;
  await getSwitch().props.onValueChange(true);
  await settle(renderer);
  assert.equal(getSwitch().props.value, false);
});

test('falha ao revogar consentimento preserva o estado ativo', async () => {
  const { renderer, state, getSwitch } = await mountEmailPermissions({ consent: true, connected: true, operational: true });
  state.failRegister = true;
  await getSwitch().props.onValueChange(false);
  const alert = renderer.alerts.at(-1);
  alert[2].find(option => option.text === 'Desativar').onPress();
  await settle(renderer);
  assert.equal(getSwitch().props.value, true);
});

test('notificações refletem permissão nativa e token registrado', async () => {
  const { renderer, getNotificationSwitch } = await mountEmailPermissions({
    notificationPermission: { status: 'granted', canAskAgain: true },
    notificationToken: 'ExponentPushToken[test]',
  });
  const texts = renderer.nodes(node => node.type === 'Text').flatMap(node => node.props.children.filter(child => typeof child === 'string'));
  assert.ok(texts.includes('Ativadas'));
  assert.equal(getNotificationSwitch().props.value, true);
});

test('notificações negadas permanentemente encaminham para as configurações', async () => {
  const { renderer, state, getNotificationSwitch } = await mountEmailPermissions({
    notificationPermission: { status: 'denied', canAskAgain: false },
  });
  const control = getNotificationSwitch();
  assert.equal(control.props.value, false);
  await control.props.onValueChange(true);
  assert.equal(state.notificationSettingsOpens, 1);
});

test('permissão concedida sem token mantém o switch ligado e abre configurações ao desativar', async () => {
  const { renderer, state, getNotificationSwitch } = await mountEmailPermissions({
    notificationPermission: { status: 'granted', canAskAgain: true },
    notificationResult: { status: 'registration-failed' },
  });
  const control = getNotificationSwitch();
  assert.equal(control.props.value, true);
  await control.props.onValueChange(false);
  await settle(renderer);
  const texts = renderer.nodes(node => node.type === 'Text').flatMap(node => node.props.children.filter(child => typeof child === 'string'));
  assert.equal(state.notificationToken, null);
  assert.ok(texts.includes('Permissão ativa; registro pendente'));
  assert.equal(state.notificationSettingsOpens, 1);
  assert.equal(getNotificationSwitch().props.value, true);
});

test('retorno das configurações atualiza o estado nativo sem nova solicitação', async () => {
  const { renderer, state, getNotificationSwitch } = await mountEmailPermissions({
    notificationPermission: { status: 'denied', canAskAgain: false },
  });
  state.notificationPermission = { status: 'granted', canAskAgain: true };
  state.notificationToken = 'ExponentPushToken[test]';
  for (const listener of state.notificationListeners) listener('active');
  await settle(renderer);
  const texts = renderer.nodes(node => node.type === 'Text').flatMap(node => node.props.children.filter(child => typeof child === 'string'));
  assert.ok(texts.includes('Ativadas'));
  assert.equal(getNotificationSwitch().props.value, true);
});
