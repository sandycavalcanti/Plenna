import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';

globalThis.__DEV__ = false;
const text = r => r.nodes(n => n.type === 'Text').flatMap(n => n.props.children.filter(c => typeof c === 'string')).join(' ');
const settle = async r => { for (let i = 0; i < 4; i++) await r.flush(); };
const button = (r, label) => r.nodes(n => n.type === 'Pressable' && n.props.children.some(c => c?.type === 'Text' && c.props.children.includes(label)))[0];

async function profile(options = {}) {
  const controller = new AbortController();
  const state = {consent: true, permission: true, status: 'READY', detailed: false, writes: [], operations: [], settings: 0, ...options};
  state.session = {id: 1, signal: controller.signal};
  const listeners = new Set(), foreground = new Set(), alerts = [];
  const guard = id => { if (state.session.id !== id || state.session.signal.aborted) throw Error('SESSION_INVALIDATED'); };
  const register = async (code, value, config) => {
    guard(config.usageMonitoringSessionId);
    state.writes.push([code, value]);
    if (code === 'MONITORAMENTO_TEMPO_USO') state.consent = value;
    if (code === 'MONITORAMENTO_ACESSOS') state.detailed = value;
  };
  const r = createRenderer({
    'react-native': {
      ...Object.fromEntries(['View','Text','Switch','Pressable','Modal','ScrollView','ActivityIndicator'].map(n => [n,n])),
      StyleSheet: {create: v => v}, Alert: {alert: (...args) => alerts.push(args)},
      AppState: {addEventListener: (_, fn) => {foreground.add(fn);return {remove: () => foreground.delete(fn)};}},
    },
    '../../../api/usageMonitoringPolicy': {usageMonitoringEnabled: true},
    '../../../api/tokenStorage': {tokenStorage: {captureSession: async () => state.session, assertSession: guard}},
    '../../../api/consentimento': {
      listarConsentimentos: async () => {
        if (state.consentError) throw Error('OFFLINE');
        if (state.consentGate) return state.consentGate;
        return [{consentimento_tipo_codigo:'MONITORAMENTO_TEMPO_USO',consentimento_status:state.consent}, {consentimento_tipo_codigo:'MONITORAMENTO_ACESSOS',consentimento_status:state.detailed}];
      }, registrarConsentimento: register,
    },
    '../../../services/monitoramentoConsentService': {alterarConsentimentoMonitoramento: async (value, session, registrar, assertSession) => {
      assertSession(session.id);await registrar('MONITORAMENTO_TEMPO_USO', value, {usageMonitoringSessionId: session.id, signal: session.signal});assertSession(session.id);
      return {consentConfirmed: true, activationPending: false};
    }},
    '../../../services/usageMonitoringService': {
      readUsageMonitoringStatus: async session => {guard(session.id);return state.statusGate ? state.statusGate : state.status;},
      prepareUsageMonitoringActivation: async session => {guard(session.id);state.operations.push('prepare');},
      synchronizeUsageMonitoring: async () => {state.operations.push('sync');},
    },
    '../../../utils/usageMonitoringStatus': {observeUsageSyncState: fn => {listeners.add(fn);return () => listeners.delete(fn);}},
    '../../../../modules/plenna-usage-stats': {getModuleStatus: async () => ({available:true}), hasUsageAccess: async () => state.permission, openUsageAccessSettings: async () => {state.settings++;return true;}},
    '../../../services/gmailOAuthService': {consultarStatusGmail: async () => null, conectarGmailInterativo: async () => {}},
    '../../../utils/error': {logApiErrors() {}},
    './styles': {__esModule:true,default:{},styles:{},presentationStyles:{}},
  });
  r.mount(r.load('src/components/ProfileComponents/Permissions/index.js').default);
  await settle(r);
  return {r,state,alerts,controller,foreground,emit: status => {state.status=status;for (const fn of listeners) fn({sessionId:state.session.id,status});},switch: () => r.nodes(n => n.type === 'Switch' && n.props.accessibilityLabel === 'Tempo em aplicativos')[0]};
}

for (const [name, options, expected] of [
  ['disabled', {consent:false}, 'Desativado'],
  ['enabled with permission', {}, 'Ativado'],
  ['Android permission missing', {permission:false}, 'Permissão necessária'],
  ['service unavailable', {status:'SERVICE_UNAVAILABLE'}, 'Temporariamente indisponível'],
  ['pending update', {status:'PENDING'}, 'Aguardando atualização dos dados.'],
  ['controlled pause', {status:'CONTROLLED_PAUSE'}, 'Atualizações pausadas'],
  ['unknown consent', {consentError:true}, 'Temporariamente indisponível'],
]) test(`compact monitoring: ${name}`, async () => {
  const h = await profile(options);
  assert.match(text(h.r), new RegExp(expected));
  assert.match(text(h.r), /Acompanhe seus hábitos de uso em aplicativos de compras/);
  assert.equal(h.r.nodes(n => n.type === 'Switch' && n.props.accessibilityLabel === 'Tempo em aplicativos').length, 1);
  assert.equal(h.switch().props.value, h.state.consentError ? false : h.state.consent);
  assert.equal(h.switch().props.disabled, !!h.state.consentError);
  assert.doesNotMatch(text(h.r), /Gerenciar monitoramento|Monitoramento autorizado|Sincronização pendente|SHEIN|Shopee|Mercado Livre|Horários autorizados|Autorizar acessos individuais/);
  assert.equal(button(h.r, 'Permitir no Android') !== undefined, h.state.permission === false);
  assert.equal(h.state.settings, 0);assert.deepEqual(h.state.writes, []);assert.deepEqual(h.state.operations, []);
  h.r.unmount();
});

test('permission recovery is contextual and refreshes after returning from Android', async () => {
  const h = await profile({permission:false});
  await button(h.r, 'Permitir no Android').props.onPress();assert.equal(h.state.settings,1);
  h.state.permission=true;for (const fn of h.foreground) fn('active');await settle(h.r);
  assert.match(text(h.r), /Ativado/);assert.equal(button(h.r,'Permitir no Android'),undefined);
  assert.deepEqual(h.state.writes,[]);h.r.unmount();
});

for (const detailed of [false,true]) test(`individual hours stay contextual, explicit choice: ${detailed}`, async () => {
  const h = await profile({detailed});
  assert.doesNotMatch(text(h.r),/Horários de uso/);
  button(h.r,'Privacidade e dados').props.onPress();await settle(h.r);
  assert.equal(h.r.nodes(n=>n.type==='Modal').length,1);
  assert.match(text(h.r), /somente enquanto está aberto/);
  assert.match(text(h.r), /preserva o histórico e não revoga a permissão Android/);
  assert.match(text(h.r), detailed ? /Horários autorizados/ : /Horários não autorizados/);
  assert.deepEqual(h.state.writes,[]);
  await button(h.r,detailed?'Desativar horários de uso':'Permitir horários de uso').props.onPress();
  if (!detailed) {
    assert.deepEqual(h.state.writes,[]);
    const confirmation=h.alerts.at(-1)[2].find(b=>b.text==='Autorizar acessos');
    await confirmation.onPress();
  }
  await settle(h.r);
  assert.deepEqual(h.state.writes,[['MONITORAMENTO_ACESSOS',!detailed]]);
  assert.deepEqual(h.state.operations,['prepare','sync']);h.r.unmount();
});

test('disabled monitoring keeps privacy accessible without granting individual hours', async () => {
  const h=await profile({consent:false});button(h.r,'Privacidade e dados').props.onPress();await settle(h.r);
  assert.match(text(h.r),/Ative Tempo em aplicativos/);
  assert.equal(button(h.r,'Permitir horários de uso'),undefined);
  assert.deepEqual(h.state.writes,[]);h.r.unmount();
});

test('main consent uses existing flow; disabling requires confirmation and does not change Android permission', async () => {
  const h=await profile();await h.switch().props.onValueChange(false);await settle(h.r);
  assert.deepEqual(h.state.writes,[]);
  assert.match(h.alerts.at(-1)[1], /histórico e a permissão Android serão preservados/);
  await h.alerts.at(-1)[2].find(b=>b.text==='Confirmar').onPress();await settle(h.r);
  assert.deepEqual(h.state.writes,[['MONITORAMENTO_TEMPO_USO',false]]);
  assert.equal(h.state.permission,true);assert.equal(h.state.settings,0);assert.equal(h.switch().props.value,false);
  await h.switch().props.onValueChange(true);await settle(h.r);
  assert.deepEqual(h.state.writes,[['MONITORAMENTO_TEMPO_USO',false],['MONITORAMENTO_TEMPO_USO',true]]);
  assert.equal(h.state.writes.some(([code])=>code==='MONITORAMENTO_ACESSOS'),false);h.r.unmount();
});

test('activation recovery retains confirmation and existing preparation/sync order', async () => {
  const h=await profile({status:'ACTIVATION_REQUIRED'});
  await button(h.r,'Concluir ativação').props.onPress();
  assert.deepEqual(h.state.operations,[]);
  await h.alerts.at(-1)[2].find(b=>b.text==='Ativar').onPress();await settle(h.r);
  assert.deepEqual(h.state.operations,['prepare','sync']);assert.deepEqual(h.state.writes,[]);h.r.unmount();
});

test('a delayed status read cannot replace a newer service failure', async () => {
  let release;const gate=new Promise(resolve=>{release=resolve;});
  const h=await profile({statusGate:gate});h.emit('SERVICE_UNAVAILABLE');await settle(h.r);
  release('READY');await settle(h.r);
  assert.match(text(h.r),/Temporariamente indisponível/);h.r.unmount();
});

test('an old hours confirmation cannot authorize the next account', async () => {
  const h=await profile();button(h.r,'Privacidade e dados').props.onPress();await settle(h.r);
  await button(h.r,'Permitir horários de uso').props.onPress();
  const confirmation=h.alerts.at(-1)[2].find(b=>b.text==='Autorizar acessos');
  h.controller.abort();h.state.session={id:2,signal:new AbortController().signal};
  await confirmation.onPress();await settle(h.r);
  assert.deepEqual(h.state.writes,[]);assert.deepEqual(h.state.operations,[]);h.r.unmount();
});

test('an old main confirmation cannot revoke the next account', async () => {
  const h=await profile();await h.switch().props.onValueChange(false);
  const confirmation=h.alerts.at(-1)[2].find(b=>b.text==='Confirmar');
  h.controller.abort();h.state.session={id:2,signal:new AbortController().signal};
  await confirmation.onPress();await settle(h.r);
  assert.deepEqual(h.state.writes,[]);h.r.unmount();
});

test('an old activation confirmation cannot prepare or sync the next account', async () => {
  const h=await profile({status:'ACTIVATION_REQUIRED'});
  await button(h.r,'Concluir ativação').props.onPress();
  const confirmation=h.alerts.at(-1)[2].find(b=>b.text==='Ativar');
  h.controller.abort();h.state.session={id:2,signal:new AbortController().signal};
  await confirmation.onPress();await settle(h.r);
  assert.deepEqual(h.state.writes,[]);assert.deepEqual(h.state.operations,[]);h.r.unmount();
});
