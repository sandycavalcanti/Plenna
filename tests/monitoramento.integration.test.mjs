import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createRenderer } from './helpers/componentRenderer.mjs';
import { usagePeriodMetrics, usageDuration } from '../src/utils/usageMonitoringView.js';
import { classifyUsageFailure } from '../src/utils/usageMonitoringStatus.js';
globalThis.__DEV__ = false;

const screenText = r => r.nodes(n => n.type === 'Text').flatMap(n => n.props.children.filter(c => typeof c === 'string' || typeof c === 'number')).join(' ').replace(/\s+/g,' ');
const native = (extra = {}) => ({ ...Object.fromEntries(['View','Text','Pressable','Switch','FlatList','ActivityIndicator','Modal','ScrollView'].map(n=>[n,n])), StyleSheet:{create:v=>v}, AppState:{currentState:'active',addEventListener:()=>({remove(){}})}, ...extra });

function profile({ denied = false, offline = false } = {}) {
  const session = {id: 1, signal: new AbortController().signal};
  const state = { permission: !denied, offline, settings: 0, consent: true, changes: [] };
  const r = createRenderer({
    'react-native':native(),
    '../UsageMonitoringControls':{__esModule:true,default:()=>null},
    '../../../api/tokenStorage':{tokenStorage:{captureSession:async()=>session,assertSession:()=>{}}},
    '../../../api/consentimento':{listarConsentimentos:async()=>{if(state.offline)throw Error('NETWORK');return [{consentimento_tipo_codigo:'MONITORAMENTO_TEMPO_USO',consentimento_status:state.consent}];},registrarConsentimento:async()=>{}},
    '../../../api/email':{consultarStatusEmail:async()=>({connected:false,operational:false}),iniciarConexaoEmail:async()=>({url:'https://accounts.google.com'})},
    'expo-web-browser':{openAuthSessionAsync:async()=>({type:'dismiss'})},
    '../../../services/monitoramentoConsentService':{alterarConsentimentoMonitoramento:async value=>{state.changes.push(value);state.consent=value;}},
    '../../../../modules/plenna-usage-stats':{getModuleStatus:async()=>({available:true}),hasUsageAccess:async()=>state.permission,openUsageAccessSettings:async()=>{state.settings++;return true;}},
    '../../../services/gmailOAuthService':{consultarStatusGmail:async()=>null,conectarGmailInterativo:async()=>{}},
    '../../../utils/error':{logApiErrors(){}},
  });
  return { r, state, mount:()=>r.mount(r.load('src/components/ProfileComponents/Permissions/index.js').default, {}) };
}

test('Perfil mantém permissão Android independente de falha na consulta do consentimento',async()=>{
  const h=profile({offline:true});h.mount();await h.r.flush();
  assert.match(screenText(h.r),/Temporariamente indisponível/);
  assert.match(screenText(h.r),/Verificar novamente/);
  assert.equal(h.r.nodes(n=>n.type==='Switch')[1].props.disabled,true);
  assert.equal(h.state.settings,0);assert.deepEqual(h.state.changes,[]);h.r.unmount();
});

test('Perfil não abre configurações automaticamente; usuário pode conceder ou revogar permissão',async()=>{
  const h=profile({denied:true});h.mount();await h.r.flush();
  assert.match(screenText(h.r),/Permissão necessária/);assert.equal(h.state.settings,0);
  const button=h.r.nodes(n=>n.type==='Pressable'&&n.props.children.some(c=>c?.props?.children?.includes('Permitir no Android')))[0];
  await button.props.onPress();assert.equal(h.state.settings,1);assert.deepEqual(h.state.changes,[]);h.r.unmount();
});

test('Cadastro mantém adesão opcional desmarcada, sem iniciar consentimento ou coleta na montagem',async()=>{
  let changes=0;
  const r=createRenderer({'../../services/monitoramentoConsentService':{alterarConsentimentoMonitoramento:async()=>changes++}});
  r.mount(r.load('src/pages/SignUpScreen/index.js').default,{navigation:{navigate(){},replace(){}},route:{params:{}}});await r.flush();
  const boxes=r.nodes(n=>n.props.accessibilityRole==='checkbox');
  const monitoring=boxes.find(n=>JSON.stringify(n.props.children).includes('Monitoramento de tempo em aplicativos'));
  assert.ok(monitoring);assert.equal(monitoring.props.accessibilityState.checked,false);assert.equal(changes,0);
  monitoring.props.onPress();await r.flush();assert.equal(changes,0);r.unmount();
});

test('internal access payload stays intact while both summary cards omit individual history and avoid its endpoint',async()=>{
  const accessReply={schemaVersion:3,date:'2026-11-07',items:[{key:'a',dailyId:'1',packageId:'com.zzkko',timezone:'America/Sao_Paulo',start:'2026-11-07T04:46:10Z',end:'2026-11-07T04:46:28Z',durationMs:18000,quality:515,collectorVersion:4}],stats:{identifiedOpenings:0,identifiedResumptions:1,unknownEntries:0},nextCursor:null};
  const data={summary:{availability:'PARTIAL',totalRegisteredMs:18000,sourceTotals:{v2RegisteredMs:18000}},legacy:[],observations:[{localDate:'2026-11-07',sourceStatus:'AVAILABLE',applications:[{packageId:'com.zzkko',durationMs:18000,durationSeconds:18,suppression:null}]}],accessStats:accessReply.stats};
  const before=JSON.stringify({accessReply,data});let accessReads=0;
  const r=createRenderer({
    '../../utils/tempoUsoSync':{obterJanelaDiaLocal:()=>({dataLocal:'2026-11-07'})},
    '../../hooks/useUsageMonitoringPeriod':{useUsageMonitoringPeriod:()=>({data,monitoring:'READY',loading:false,readError:false,refresh(){}})},
    '../../services/usageMonitoringService':{synchronizeUsageMonitoring:()=>assert.fail('presentation must not send')},
    '../../api/client':{apiClient:{get:async()=>{accessReads++;return {data:accessReply};}}},
  });
  r.mount(r.load('src/components/UsageTimePanel/index.js').default,{month:'2026-11'});
  for(const compact of [false,true]){
    r.update({month:'2026-11',compact});await r.flush();
    assert.match(screenText(r),/SHEIN/);assert.match(screenText(r),/18 s/);
    assert.doesNotMatch(screenText(r),/retomada|independente|04:46|com\.zzkko|qualidade|UTC|515/);
    assert.equal(r.nodes(n=>['FlatList','Modal'].includes(n.type)).length,0);
  }
  assert.equal(accessReads,0);assert.equal(JSON.stringify({accessReply,data}),before);r.unmount();
});

test('Milissegundos do resumo preservam uso subsegundo e dados antigos continuam legíveis',()=>{
  const data={summary:{availability:'PARTIAL',totalRegisteredSeconds:0,totalRegisteredMs:299,sourceTotals:{v2RegisteredSeconds:0,v2RegisteredMs:299}},observations:[{localDate:'2026-11-07',sourceStatus:'AVAILABLE',applications:[{packageId:'com.zzkko',durationSeconds:0,durationMs:299,suppression:null}]}]};
  const metrics=usagePeriodMetrics(data);assert.equal(metrics.total,.299);assert.equal(usageDuration(metrics.total),'< 1 s');assert.equal(metrics.ranking[0].label,'SHEIN');assert.equal(metrics.daily[0].seconds,.299);
  delete data.summary.totalRegisteredMs;delete data.summary.sourceTotals.v2RegisteredMs;delete data.observations[0].applications[0].durationMs;
  assert.equal(usagePeriodMetrics(data).total,0);
  assert.equal(classifyUsageFailure(Error('CONSENT_CHANGE_IN_PROGRESS')).status,'PENDING');
});

test('API de consentimento sinaliza alteração pendente e revogação confirmada sem depender de banco',async()=>{
  const session={id:1,signal:new AbortController().signal};let release;const events=[];
  const context=vm.createContext({Promise,Map,Set,Error,__DEV__:false});
  const m=new vm.SourceTextModule(await readFile(new URL('../src/api/consentimento.js',import.meta.url),'utf8'),{context});
  await m.link(async name=>{
    const values=name==='./client'?{apiClient:{post:()=>new Promise(resolve=>{release=resolve;})}}:{tokenStorage:{captureSession:async()=>session,assertSession:()=>{}}};
    const mock=new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v);},{context});
    await mock.link(()=>{});await mock.evaluate();return mock;
  });await m.evaluate();
  m.namespace.observarAlteracaoMonitoramento((id,change)=>events.push({id,change}));
  const pending=m.namespace.registrarConsentimento('MONITORAMENTO_TEMPO_USO',false,{usageMonitoringSessionId:1});await new Promise(setImmediate);
  assert.equal(m.namespace.monitoramentoEmAlteracao(1),true);release({data:{status:false}});await pending;
  assert.equal(m.namespace.monitoramentoEmAlteracao(1),false);assert.equal(events.length,2);assert.equal(events[1].change.confirmed,true);assert.equal(events[1].change.status,false);
});

for(const [accept,permission] of [[false,false],[true,false],[true,true]])test(`cadastro completo simulado: monitoramento=${accept}, permissão Android=${permission}`,async()=>{
  const requests=[],alerts=[];let settings=0;const control=new AbortController(),session={id:1,signal:control.signal};
  const registrar=async(code,status)=>{requests.push({url:'/consentimento',code,status});};
  const r=createRenderer({
    '../../api/client':{apiClient:{post:async(url,body)=>{requests.push({url,body});return {data:{token:'session-test-only'}};},get:async()=>({data:[{categoria_id:27,categoria_nome:'Outros'}]})}},
    '../../api/tokenStorage':{tokenStorage:{setToken:async()=>{},captureSession:async()=>session,assertSession:id=>assert.equal(id,1)}},
    '../../api/consentimento':{registrarConsentimento:registrar},
    '../../services/monitoramentoConsentService':{alterarConsentimentoMonitoramento:async(value,s,register,guard)=>{guard(s.id);await register('MONITORAMENTO_TEMPO_USO',value);return {consentConfirmed:true,activationPending:false};}},
    '../../../modules/plenna-usage-stats':{hasUsageAccess:async()=>permission,openUsageAccessSettings:async()=>{settings++;return true;}},
  });
  r.mount(r.load('src/pages/SignUpScreen/index.js').default,{navigation:{navigate(){},replace(){}},route:{params:{}}});await r.flush();
  for(const [placeholder,text]of [['Como devemos te chamar?','Pessoa de teste'],['E-mail','offline@example.invalid'],['Senha','Teste#2026'],['Confirmação da senha','Teste#2026']]){
    r.nodes(n=>n.type==='CustomTextInput'&&n.props.placeholder===placeholder)[0].props.onChangeText(text);await r.flush();
  }
  r.nodes(n=>n.type==='TouchableOpacity'&&JSON.stringify(n.props.children).includes('Li e concordo com os'))[0].props.onPress();await r.flush();
  if(accept){r.nodes(n=>n.props.accessibilityRole==='checkbox'&&JSON.stringify(n.props.children).includes('Monitoramento de tempo em aplicativos'))[0].props.onPress();await r.flush();}
  await r.nodes(n=>n.type==='Button'&&n.props.title==='Cadastrar')[0].props.onPress();await r.flush();
  assert.ok(requests.some(x=>x.url==='/auth/register'));assert.ok(requests.some(x=>x.url==='/auth/login'));
  assert.equal(requests.filter(x=>x.url==='/consentimento').length,accept?1:0);assert.equal(settings,0);
  assert.equal(requests.some(x=>x.url==='/v2/tempo-uso/observations'),false);
  r.unmount();
});

test('consentimento salvo não é apresentado como falha quando a preparação local do aparelho falha',async()=>{
  const context=vm.createContext({Promise,Error});let writes=0,syncs=0;
  const synthetic=async values=>{const m=new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});await m.link(()=>{});await m.evaluate();return m;};
  const activation=await synthetic({prepareUsageMonitoringActivation:async()=>{throw Error('NATIVE_UNAVAILABLE');},synchronizeUsageMonitoring:async()=>syncs++});
  const m=new vm.SourceTextModule(await readFile(new URL('../src/services/monitoramentoConsentService.js',import.meta.url),'utf8'),{context,importModuleDynamically:async()=>activation});
  await m.link(()=>synthetic({usageMonitoringEnabled:true}));await m.evaluate();
  const session={id:1,signal:new AbortController().signal};
  const outcome=await m.namespace.alterarConsentimentoMonitoramento(true,session,async()=>writes++,()=>{});
  assert.equal(writes,1);assert.equal(outcome.consentConfirmed,true);assert.equal(outcome.activationPending,true);assert.equal(syncs,0);
  await assert.rejects(m.namespace.alterarConsentimentoMonitoramento(true,session,async()=>{throw Error('CONSENT_POST_FAILED');},()=>{}),/CONSENT_POST_FAILED/);
  const revoked=await m.namespace.alterarConsentimentoMonitoramento(false,session,async()=>writes++,()=>{});assert.equal(revoked.activationPending,false);assert.equal(writes,2);
});
