import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderer } from './helpers/componentRenderer.mjs';

function fixture(){return {summary:{availability:'PARTIAL',totalRegisteredSeconds:90,sourceTotals:{v2RegisteredSeconds:90,legacyRegisteredSeconds:null}},legacy:[],observations:[
  {associationId:'a',localDate:'2026-11-05',sourceStatus:'AVAILABLE',applications:[{packageId:'com.zzkko',durationSeconds:30,suppression:null}]},
  {associationId:'a',localDate:'2026-11-06',sourceStatus:'AVAILABLE',applications:[{packageId:'com.zzkko',durationSeconds:60,suppression:null}]},
]};}
function panel(state,props={},mocks={}){
  let current={monitoring:'READY',loading:false,readError:false,data:null,refresh:()=>{},...state};
  const r=createRenderer({
    '../../hooks/useUsageMonitoringPeriod':{useUsageMonitoringPeriod:()=>current},
    '../../services/usageMonitoringService':{synchronizeUsageMonitoring:async()=>{}},
    '../services/usageMonitoringService':{activateUsageMonitoring:async()=>assert.fail('confirmation required')},
    '../../utils/tempoUsoSync':{obterJanelaDiaLocal:()=>({dataLocal:'2026-11-06'})},
    ...mocks,
  });
  r.mount(r.load('src/components/UsageTimePanel/index.js').default,{month:'2026-11',...props});
  return {...r,change:next=>{current={...current,...next};r.update({});},text:()=>r.nodes(n=>n.type==='Text').flatMap(n=>n.props.children.filter(v=>typeof v==='string'||typeof v==='number')).join(' ')};
}
for(const monitoring of ['PERMISSION_REQUIRED','CONSENT_REQUIRED','SYNCING','ERROR','SERVICE_UNAVAILABLE'])test(`panel presents exactly one primary message: ${monitoring}`,()=>{
  const r=panel({monitoring,readError:true},{compact:true});
  assert.equal(r.nodes(n=>n.props?.testID==='usage-main-message').length,1);
  assert.doesNotMatch(r.text(),/registros sincronizados/);r.unmount();
});
test('Home has the current-day total and an accessible details action supplied by its screen',()=>{
  let details=0;
  const r=panel({data:fixture()},{compact:true,onDetails:()=>details++});
  assert.match(r.text(),/1 min/);assert.match(r.text(),/SHEIN/);assert.match(r.text(),/HOJE/);
  assert.doesNotMatch(r.text(),/30 s|Dashboard|Fontes|Entradas|Excluir/);
  const button=r.nodes(n=>n.type==='Pressable')[0];assert.equal(button.props.accessibilityRole,'button');button.props.onPress();assert.equal(details,1);r.unmount();
});

test('Dashboard shows app distribution, never a daily technical timeline',()=>{
  const r=panel({data:fixture()});assert.match(r.text(),/SHEIN/);
  assert.equal(r.nodes(n=>n.props?.testID==='usage-app-bar').length,1);
  assert.doesNotMatch(r.text(),/Fontes|Evolu|Entradas|qualidade/);r.unmount();
});

test('history value remains visible after a read failure, with a single failure message',()=>{
  const r=panel({data:fixture(),readError:true});assert.match(r.text(),/1 min/);
  assert.equal(r.nodes(n=>n.props?.testID==='usage-main-message').length,1);
  assert.match(r.text(),/Não foi possível atualizar este período/);r.unmount();
});
test('absent history never claims a previous value was preserved',()=>{
  const r=panel({data:{summary:{availability:'NO_DATA',sourceTotals:{}},observations:[{sourceStatus:'UNAVAILABLE',lastAvailable:null}],legacy:[]}});
  assert.doesNotMatch(r.text(),/preservado|registros sincronizados/);r.unmount();
});

test('Dashboard requests explicit confirmation, refreshes in place and routes missing permission to Profile',async()=>{
  const calls=[];
  const abort=new AbortController(),session={id:7,signal:abort.signal};
  let status='READY';
  const r=panel({monitoring:'ACTIVATION_REQUIRED',refresh:()=>calls.push('refresh')},{onSettings:()=>calls.push('settings')},{
    '../api/tokenStorage':{tokenStorage:{captureSession:async()=>session,assertSession:id=>assert.equal(id,7)}},
    '../services/usageMonitoringService':{activateUsageMonitoring:async captured=>{assert.equal(captured,session);calls.push('activate');return status;}},
  });
  assert.match(r.text(),/Retomar monitoramento/);
  const open=()=>r.nodes(n=>n.type==='Pressable')[0].props.onPress();
  await open();assert.deepEqual(calls,[]);assert.equal(r.alerts[0][2][0].text,'Cancelar');
  await r.alerts[0][2][1].onPress();assert.deepEqual(calls,['activate','refresh']);
  status='PERMISSION_REQUIRED';await open();await r.alerts[1][2][1].onPress();
  assert.deepEqual(calls,['activate','refresh','activate','settings']);
  await open();abort.abort();await r.alerts[2][2][1].onPress();
  assert.equal(calls.length,4);r.unmount();
});

test('Dashboard distinguishes partial historical coverage from a retained outdated reading',()=>{
  const data=fixture();
  const missing={localDate:'2026-11-04',sourceStatus:'UNAVAILABLE',lastAvailable:null};
  data.observations.unshift(missing);
  const r=panel({data});
  assert.match(r.text(),/Há períodos sem dados/);assert.doesNotMatch(r.text(),/desatualizados/);
  const stale={...data,observations:[{...data.observations[1],sourceStatus:'UNAVAILABLE',lastAvailable:data.observations[1]},data.observations[2]]};
  r.change({data:stale});assert.match(r.text(),/Alguns registros podem estar desatualizados/);
  r.change({data:fixture()});assert.doesNotMatch(r.text(),/sem dados|desatualizados/);r.unmount();
});

test('Profile uses the shared confirmation and refuses a dialog from a logged-out session',async()=>{
  let controller=new AbortController(),sessionId=7;
  const activated=[];
  const tokenStorage={captureSession:async()=>({id:sessionId,signal:controller.signal}),assertSession:id=>assert.equal(id,sessionId)};
  const service={activateUsageMonitoring:async session=>{activated.push(session.id);return 'READY';},
    readUsageMonitoringStatus:async()=> 'ACTIVATION_REQUIRED',hasPreviouslyActivatedUsageMonitoring:async()=>true};
  const r=createRenderer({
    '../../../api/tokenStorage':{tokenStorage},'../api/tokenStorage':{tokenStorage},
    '../../../services/usageMonitoringService':service,'../services/usageMonitoringService':service,
    '../../../api/consentimento':{listarConsentimentos:async()=>[]},
    '../../ReadingDetails':{__esModule:true,default:()=>null},
  });
  r.mount(r.load('src/components/ProfileComponents/UsageMonitoringControls/index.js').default,{consent:true,permission:true});
  await r.flush();
  const button=r.nodes(n=>n.type==='Pressable')[0];
  await button.props.onPress();assert.equal(r.alerts[0][0],'Retomar monitoramento');
  await r.alerts[0][2][1].onPress();assert.deepEqual(activated,[7]);
  await button.props.onPress();controller.abort();controller=new AbortController();sessionId=8;
  await r.alerts[1][2][1].onPress();assert.deepEqual(activated,[7]);
  r.unmount();
});
