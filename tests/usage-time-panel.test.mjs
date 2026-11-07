import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderer } from './helpers/componentRenderer.mjs';

function fixture(){return {summary:{availability:'PARTIAL',totalRegisteredSeconds:90,sourceTotals:{v2RegisteredSeconds:90,legacyRegisteredSeconds:null}},legacy:[],observations:[
  {associationId:'a',localDate:'2026-11-05',sourceStatus:'AVAILABLE',applications:[{packageId:'com.zzkko',durationSeconds:30,suppression:null}]},
  {associationId:'a',localDate:'2026-11-06',sourceStatus:'AVAILABLE',applications:[{packageId:'com.zzkko',durationSeconds:60,suppression:null}]},
]};}
function panel(state,props={}){
  let current={monitoring:'READY',loading:false,readError:false,data:null,refresh:()=>{},...state};
  const r=createRenderer({
    '../../hooks/useUsageMonitoringPeriod':{useUsageMonitoringPeriod:()=>current},
    '../../services/usageMonitoringService':{synchronizeUsageMonitoring:async()=>{}},
    '../../utils/tempoUsoSync':{obterJanelaDiaLocal:()=>({dataLocal:'2026-11-06'})},
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
