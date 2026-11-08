import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRenderer} from './helpers/componentRenderer.mjs';
import {usageCardMetrics,usageCardState,usageTimeLabel,usageTodayData,usageUpdateLabel} from '../src/utils/usageMonitoringView.js';
import {classifyUsageFailure,publishUsageSyncState,usageSyncState} from '../src/utils/usageMonitoringStatus.js';

const observation=(day,apps,extra={})=>({associationId:'fixture',localDate:day,observedAt:day+'T12:16:10Z',sourceStatus:'AVAILABLE',applications:apps.map(([packageId,ms])=>({packageId,durationMs:ms,durationSeconds:Math.floor(ms/1000),suppression:null})),...extra});
function fixture(){return {summary:{localMonth:'2026-11',availability:'PARTIAL',totalRegisteredMs:109657,sourceTotals:{v2RegisteredMs:109657,legacyRegisteredMs:null}},observations:[observation('2026-11-06',[['com.shopee.br',60000]]),observation('2026-11-07',[['com.zzkko',49657],['com.shopee.br',0],['com.mercadolibre',0]])],legacy:[],accessStats:{identifiedOpenings:99,identifiedResumptions:55}};}
function render(initial={},props={}){
 let current={monitoring:'READY',loading:false,readError:false,data:fixture(),refresh:()=>{},...initial};
 const calls={periods:[],sync:0,reads:0};
 current.refresh=()=>calls.reads++;
 const r=createRenderer({
  '../../hooks/useUsageMonitoringPeriod':{useUsageMonitoringPeriod:(...args)=>{calls.periods.push(args);return current;}},
  '../../services/usageMonitoringService':{synchronizeUsageMonitoring:async()=>calls.sync++},
  '../../utils/tempoUsoSync':{obterJanelaDiaLocal:()=>({dataLocal:'2026-11-07'})},
 });
 r.mount(r.load('src/components/UsageTimePanel/index.js').default,{month:'2026-11',...props});
 return {...r,calls,change:(next,newProps={})=>{current={...current,...next};r.update(newProps);},text:()=>r.nodes(n=>n.type==='Text').flatMap(n=>n.props.children.filter(x=>typeof x==='string'||typeof x==='number')).join(' ')};
}
test('Home displays only real current-day time and one top app, ignoring the supplied historical month',()=>{
 const r=render({}, {compact:true,month:'2026-10'});
 assert.match(r.text(),/TEMPO REGISTRADO HOJE.*49 s.*Aplicativo mais utilizado.*SHEIN.*49 s/);
 assert.equal(r.nodes(n=>n.props?.testID==='usage-today-highlight').length,1);
 assert.doesNotMatch(r.text(),/Shopee|Mercado Livre|1 min|99|55/);
 assert.deepEqual(r.calls.periods[0],['2026-11']);assert.equal(r.nodes(n=>n.props?.testID==='usage-app-chart').length,0);r.unmount();
});
test('monthly total and horizontal bars use the selected month and shares of all registered apps',()=>{
 const data=fixture();data.observations=[observation('2026-10-02',[['com.zzkko',120000],['com.shopee.br',60000],['com.mercadolibre',0]])];data.summary={...data.summary,localMonth:'2026-10',totalRegisteredMs:180000,sourceTotals:{v2RegisteredMs:180000}};
 const r=render({data},{month:'2026-10'});
 assert.match(r.text(),/Tempo registrado no mês.*3 min.*SHEIN/);assert.doesNotMatch(r.text(),/outubro/i);
 assert.deepEqual(r.calls.periods[0],['2026-10']);assert.doesNotMatch(r.text(),/Mercado Livre/);
 const bars=r.nodes(n=>n.props?.testID==='usage-app-bar');assert.equal(bars.length,2);
 assert.ok(Math.abs(parseFloat(bars[0].props.style[1].width)-200/3)<1e-9);assert.ok(Math.abs(parseFloat(bars[1].props.style[1].width)-100/3)<1e-9);
 assert.match(r.text(),/66,7%.*33,3%/);r.unmount();
});
test('technical information and individual history are absent in both card variants',()=>{
 for(const compact of [true,false]){
  const r=render({}, {compact});
  assert.doesNotMatch(r.text(),/acompanhados|cobertura|qualidade|Entradas|independentes|retomadas|Fontes|exclus|09:13|Ver detalhes|registros e/i);
  assert.equal(r.nodes(n=>['Modal','FlatList','ScrollView'].includes(n.type)).length,0);
  r.unmount();
 }
 const source=readFileSync(new URL('../src/components/UsageTimePanel/index.js',import.meta.url),'utf8');assert.doesNotMatch(source,/AccessHistory|\/accesses|\/deletions/);
});
test('empty history does not invent zero or a leading app; observed zero stays zero registered',()=>{
 const r=render({data:{summary:{availability:'NO_DATA'},observations:[],legacy:[]}}, {compact:true});
 assert.match(r.text(),/Nenhum tempo registrado hoje/);assert.match(r.text(),/Seus dados de uso aparecerão aqui quando estiverem disponíveis/);assert.doesNotMatch(r.text(),/0 s|SHEIN|Mais utilizado|Atualizado/);
 const zero=fixture();zero.observations=[observation('2026-11-07',[['com.zzkko',0]])];zero.summary.totalRegisteredMs=0;zero.summary.sourceTotals.v2RegisteredMs=0;
 r.change({data:zero});assert.match(r.text(),/TEMPO REGISTRADO HOJE.*0 s/);assert.doesNotMatch(r.text(),/mais utilizado/i);r.unmount();
});
test('many apps stay compact until the user expands totals, with no horizontal list',async()=>{
 const data={summary:{availability:'PARTIAL',totalRegisteredSeconds:210,sourceTotals:{v2RegisteredSeconds:null,legacyRegisteredSeconds:210}},observations:[],legacy:Array.from({length:6},(_,i)=>({tempo_uso_nome:`Loja ${i+1}`,tempo_uso_data_local:'2026-11-07',tempo_uso_duracao_segundos:(i+1)*10}))};
 const r=render({data});assert.equal(r.nodes(n=>n.props?.testID==='usage-app-bar').length,4);assert.doesNotMatch(r.text(),/Loja 1|Loja 2/);
 const widths=()=>r.nodes(n=>n.props?.testID==='usage-app-bar').map(n=>parseFloat(n.props.style.at(-1).width));
 assert.ok(Math.abs(widths()[0]-60/210*100)<1e-9);assert.ok(widths().reduce((a,b)=>a+b,0)<100);
 const button=r.nodes(n=>n.type==='Pressable'&&n.props.accessibilityState)[0];button.props.onPress();await r.flush();
 assert.match(r.text(),/Loja 1/);assert.match(r.text(),/Recolher aplicativos/);assert.equal(r.nodes(n=>n.type==='ScrollView').length,0);r.unmount();
});
test('Dashboard avoids double horizontal gutters while Home keeps its surrounding margin',()=>{
 const r=createRenderer();const panel=r.load('src/components/UsageTimePanel/styles.js').styles;
 const category=r.load('src/components/DashboardComponents/Categoria/styles.js').styles;
 assert.equal(panel.section.marginHorizontal,category.section.marginHorizontal);
 assert.equal(panel.section.marginHorizontal,0);assert.equal(panel.compactSection.marginHorizontal,18);
 assert.equal(panel.section.width,undefined);assert.equal(panel.section.maxWidth,undefined);
 assert.equal(panel.barItem.flexDirection,'row');assert.equal(panel.barCopy.flex,1);assert.equal(panel.barTrack.width,'100%');assert.equal(panel.barFill.height,'100%');
});

test('one real app uses 100 percent, while zero or unavailable totals never produce percentages',()=>{
 const r=render({}, {compact:false});
 const data=fixture();data.observations=[observation('2026-11-07',[['com.zzkko',49657]])];data.summary.totalRegisteredMs=49657;data.summary.sourceTotals.v2RegisteredMs=49657;
 r.change({data});assert.equal(r.nodes(n=>n.props?.testID==='usage-app-bar')[0].props.style.at(-1).width,'100%');assert.match(r.text(),/100%/);
 for(const total of [null,0]){
  const card=createRenderer();card.mount(card.load('src/components/UsageTimePanel/UsageTimeCard.js').default,{total,apps:[{label:'SHEIN',seconds:49}],state:{kind:'DATA'}});
  assert.equal(card.nodes(n=>n.props?.testID==='usage-app-bar').length,0);card.unmount();
 }
 r.unmount();
});

test('controlled pause remains invisible with or without data, while a real read failure keeps its retry',()=>{
 for(const compact of [true,false]){
  const r=render({monitoring:'CONTROLLED_PAUSE'},{compact});assert.doesNotMatch(r.text(),/pausad|liberaç|sucesso/i);
  r.change({data:null});assert.match(r.text(),/indisponível/);assert.doesNotMatch(r.text(),/0 s|pausad|liberaç/i);
  r.change({readError:true});assert.match(r.text(),/Não foi possível carregar/);assert.equal(r.nodes(n=>n.type==='Pressable').length,1);r.unmount();
 }
});
test('short and long durations preserve meaningful units and never round a positive short access to zero minutes',()=>{
 for(const [value,label] of [[0,'0 s'],[0.5,'< 1 s'],[19.763,'19 s'],[49.657,'49 s'],[60,'1 min'],[3600,'1 h'],[3660,'1 h 1 min']])assert.equal(usageTimeLabel(value),label);
});
test('last update is an observed timestamp, unaffected by reads or missing timestamps',()=>{
 const d=fixture();const label=usageUpdateLabel(d);d.serverTime='2099-01-01T00:00:00Z';assert.equal(usageUpdateLabel(d),label);
 assert.equal(usageUpdateLabel({observations:[],legacy:[]}),null);
});
test('real failures remain visible alongside historical values; controlled pause never claims success or offers another send',()=>{
 const r=render();const original=r.text();assert.match(original,/1 min/);
 r.change({monitoring:'ERROR'});assert.match(r.text(),/1 min/);assert.match(r.text(),/Não foi possível atualizar/);
 r.change({monitoring:'CONTROLLED_PAUSE'});assert.doesNotMatch(r.text(),/pausadas|liberação/i);assert.match(r.text(),/1 min/);
 assert.doesNotMatch(r.text(),/sincronizados|sucesso|Cobertura/);
 assert.equal(r.nodes(n=>n.type==='Pressable').length,0);assert.equal(r.calls.sync,0);assert.equal(r.calls.reads,0);
 r.change({readError:true});assert.match(r.text(),/Não foi possível atualizar este período/);
 r.nodes(n=>n.type==='Pressable')[0].props.onPress();assert.equal(r.calls.sync,0);assert.equal(r.calls.reads,1);r.unmount();
});
test('only exact control codes with matching HTTP status pause retries; genuine 409/503 failures remain errors',()=>{
 const error=(status,code)=>({response:{status,data:{error:{code}}}});
 assert.equal(classifyUsageFailure(error(409,'CONTROLLED_SYNC_FINISHED')).status,'CONTROLLED_PAUSE');
 assert.equal(classifyUsageFailure(error(503,'HOMOLOGATION_CAPTURE_NOT_ARMED')).status,'CONTROLLED_PAUSE');
 assert.equal(classifyUsageFailure(error(503,'CONTROLLED_SYNC_FINISHED')).status,'SERVICE_UNAVAILABLE');
 assert.equal(classifyUsageFailure(error(409,'REVISION_CONFLICT')).status,'ERROR');
 assert.equal(classifyUsageFailure(error(503,'RF017_UNAVAILABLE')).status,'SERVICE_UNAVAILABLE');
 publishUsageSyncState(800,'READY');publishUsageSyncState(800,'CONTROLLED_PAUSE');assert.equal(usageSyncState(800).status,'CONTROLLED_PAUSE');assert.equal(usageSyncState(801).status,'PENDING');
});
test('permission, disabled collection, unavailable service and loading keep a single understandable state',()=>{
 for(const [monitoring,message] of [['PERMISSION_REQUIRED',/acesso no Android/],['CONSENT_REQUIRED',/desativado/],['SERVICE_UNAVAILABLE',/indisponível/]]){
  const r=render({monitoring});assert.match(r.text(),message);assert.match(r.text(),/1 min/);assert.doesNotMatch(r.text(),/HTTP|503|stack/);r.unmount();
 }
 const r=render({data:null,loading:true});assert.match(r.text(),/Carregando/);assert.equal(r.nodes(n=>n.type==='ActivityIndicator').length,1);r.unmount();
});
