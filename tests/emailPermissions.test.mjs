import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderer } from './helpers/componentRenderer.mjs';

const settle = async renderer => {
  for (let index = 0; index < 8; index += 1) await renderer.flush();
};

async function mountEmailPermissions({ consent = false, connected = false, operational = connected, oauthResult = 'success' } = {}) {
  const state = {
    consent,
    connected,
    operational,
    oauthCalls: 0,
    registerCalls: [],
    failRegister: false,
  };
  const session = { id: 1, signal: new AbortController().signal };
  const renderer = createRenderer({
    'react-native': {
      View: 'View', Text: 'Text', Switch: 'Switch', Pressable: 'Pressable',
      AppState: { addEventListener: () => ({ remove() {} }) },
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
      consultarStatusEmail: async () => ({ connected: state.connected, operational: state.operational }),
      iniciarConexaoEmail: async () => ({ url: 'https://accounts.google.com/oauth' }),
    },
    'expo-web-browser': {
      openAuthSessionAsync: async () => {
        state.oauthCalls += 1;
        state.connected = true;
        state.operational = true;
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
  });
  renderer.mount(renderer.load('src/components/ProfileComponents/Permissions/index.js').default, {});
  await settle(renderer);
  const getSwitch = () => renderer.nodes(node => node.type === 'Switch' && node.props.accessibilityLabel === 'Captura via e-mail')[0];
  return { renderer, state, getSwitch };
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

test('ativação conecta Gmail antes de registrar EMAIL=true', async () => {
  const { renderer, state, getSwitch } = await mountEmailPermissions();
  await getSwitch().props.onValueChange(true);
  await settle(renderer);
  assert.equal(state.oauthCalls, 1);
  assert.deepEqual(state.registerCalls, [{ codigo: 'EMAIL', status: true }]);
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
