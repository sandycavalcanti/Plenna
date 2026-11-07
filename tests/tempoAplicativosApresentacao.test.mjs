import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';
import { usageCardMetrics, usageLegacyMetrics, usageCardState, usageUpdateLabel } from '../src/utils/usageMonitoringView.js';

const today = '2026-11-07';
const observation = (date, packageId, seconds) => ({associationId:packageId, localDate:date, sourceStatus:'AVAILABLE', observedAt:date+'T12:00:00Z', applications:[{packageId,durationSeconds:seconds,suppression:null}]});
const fixture = () => ({summary:{availability:'PARTIAL',coverage:'PARTIAL',totalRegisteredSeconds:180,sourceTotals:{v2RegisteredSeconds:180,legacyRegisteredSeconds:null}},observations:[observation(today,'com.zzkko',120),observation('2026-11-06','com.shopee.br',60)],legacy:[],accessStats:{identifiedOpenings:10,identifiedResumptions:5,unknownEntries:1}});
const screenText = r => r.nodes(n => n.type==='Text').flatMap(n=>n.props.children.filter(c=>typeof c==='string'||typeof c==='number')).join(' ');
const getButton = (r,label) => r.nodes(n=>n.type==='Pressable'&&n.props.children.some(c=>c?.props?.children?.includes(label)))[0];
function harness(state={},props={}) {
  const calls=[];
  const mocks={
    '../../utils/tempoUsoSync':{obterJanelaDiaLocal:()=>({dataLocal:today})},
    '../../../utils/tempoUsoSync':{obterJanelaDiaLocal:()=>({dataLocal:today})},
    '../../hooks/useUsageMonitoringPeriod':{useUsageMonitoringPeriod:(...args)=>{calls.push(args);return {data:fixture(),monitoring:'READY',loading:false,readError:false,refresh(){},...state};}},
    '../../services/usageMonitoringService':{synchronizeUsageMonitoring:async()=>{}},
  };
  const r=createRenderer(mocks);
  const usageStyles=r.load('src/components/UsageTimePanel/styles.js');
  const categoryStyles=r.load('src/components/DashboardComponents/Categoria/styles.js');
  mocks['./styles']=usageStyles;
  mocks['../DashboardComponents/Categoria/styles']=categoryStyles;
  r.mount(r.load('src/components/UsageTimePanel/index.js').default,{month:'2026-11',...props});
  return {r,calls,categoryStyles,usageStyles};
}

test('Home reads the current month but presents only today and its top app, without extra access requests',()=>{
  const h=harness({}, {compact:true,month:'2026-10'});
  assert.deepEqual(h.calls[0],['2026-11']);
  assert.match(screenText(h.r),/HOJE/);assert.match(screenText(h.r),/2 min/);assert.match(screenText(h.r),/TEMPO REGISTRADO HOJE/);
  assert.match(screenText(h.r),/SHEIN/);assert.doesNotMatch(screenText(h.r),/Shopee/);
  assert.equal(h.r.nodes(n=>n.props?.testID==='usage-app-chart').length,0);h.r.unmount();
});

test('monthly data shows a real top app, exact durations and proportional bars, with no artificial apps',()=>{
  const h=harness();assert.deepEqual(h.calls[0],['2026-11']);
  assert.match(screenText(h.r),/Tempo registrado no mês/);assert.match(screenText(h.r),/3 min/);assert.match(screenText(h.r),/SHEIN/);
  assert.doesNotMatch(screenText(h.r),/Mercado Livre/);
  const bars=h.r.nodes(n=>n.props?.testID==='usage-app-bar');
  assert.equal(bars.length,2);
  assert.ok(Math.abs(parseFloat(bars[0].props.style.at(-1).width)-200/3)<1e-9);
  assert.ok(Math.abs(parseFloat(bars[1].props.style.at(-1).width)-100/3)<1e-9);h.r.unmount();
});

test('Dashboard passes its selected past month to the existing read hook',()=>{
  const h=harness({}, {month:'2026-10'});assert.deepEqual(h.calls[0],['2026-10']);assert.doesNotMatch(screenText(h.r),/outubro/i);h.r.unmount();
});

for(const compact of [false,true]) test(`technical metadata stays out of the primary interface: compact=${compact}`,()=>{
  const data=fixture();data.observations[0].qualityFlags=['CLOCK_ANOMALY'];
  const before=JSON.stringify(data),h=harness({data},{compact});
  assert.doesNotMatch(screenText(h.r),/cobertura|fontes|entradas|retomadas|qualidade|snapshot|sincroniza|acompanhados|Indicadores de tempo|Evolução diária/i);
  assert.equal(JSON.stringify(data),before);h.r.unmount();
});

test('monthly outer gutter matches Gastos por categoria without fixed card widths',()=>{
  const h=harness();
  const root=h.r.nodes(n=>n.type==='View')[0];
  const style=Object.assign({},...root.props.style.filter(Boolean));
  assert.equal(style.marginHorizontal,h.categoryStyles.styles.section.marginHorizontal);
  assert.equal(style.marginHorizontal,0);assert.equal(style.width,undefined);assert.equal(style.maxWidth,undefined);
  assert.equal(h.r.nodes(n=>n.type==='ProfileCard')[0].props.variant,'dashboard');h.r.unmount();
});

test('missing or ambiguous values never become zero or an invented most-used app',()=>{
  const data=fixture();data.summary.availability='AMBIGUOUS';data.summary.totalRegisteredSeconds=null;
  assert.deepEqual(usageCardMetrics(data,today),{total:null,apps:[]});
  assert.deepEqual(usageLegacyMetrics([{tempo_uso_nome:'Loja',tempo_uso_duracao_segundos:null,tempo_uso_minutos:null}]),{total:null,apps:[]});
  const h=harness({data});assert.doesNotMatch(screenText(h.r),/0 s|Mais utilizado|SHEIN/);h.r.unmount();
});

test('future data is not presented as collected usage',()=>{
  const data=fixture();data.observations.push(observation('2026-11-08','com.zzkko',60));
  assert.deepEqual(usageCardMetrics(data,today),{total:null,apps:[]});
});

test('legacy names contribute only when the real durations reconcile with the API total',()=>{
  const data=fixture();data.summary.totalRegisteredSeconds=210;
  data.legacy=[{tempo_uso_nome:'Outra loja',tempo_uso_data_local:today,tempo_uso_duracao_segundos:30}];
  const metrics=usageCardMetrics(data,today);
  assert.equal(metrics.total,210);assert.deepEqual(metrics.apps.map(a=>a.seconds),[120,60,30]);
  data.summary.totalRegisteredSeconds=999;assert.equal(usageCardMetrics(data,today).apps.length,0);
});

test('failed service, empty, disabled and permission states remain distinct without fake totals',()=>{
  const empty={summary:{availability:'NO_DATA'},observations:[],legacy:[]},metrics={total:null,apps:[]};
  for(const [monitoring,kind] of [['READY','EMPTY'],['SERVICE_UNAVAILABLE','SERVICE_UNAVAILABLE'],['CONSENT_REQUIRED','DISABLED'],['PERMISSION_REQUIRED','PERMISSION']]) {
    const state=usageCardState({monitoring},empty,metrics,false);assert.equal(state.kind,kind);
    assert.doesNotMatch(state.message,/503|cobertura|fonte|snapshot/i);
  }
  assert.equal(usageCardState({monitoring:'SERVICE_DISABLED'},empty,metrics,false).action,null);
});

test('last update never invents a timestamp or substitutes the time of a failed attempt',()=>{
  assert.equal(usageUpdateLabel({observations:[]}),null);
  const data=fixture(),label=usageUpdateLabel(data);
  data.observations=[{sourceStatus:'UNAVAILABLE',observedAt:'2026-11-08T12:00:00Z',lastAvailable:data.observations[0]}];
  assert.equal(usageUpdateLabel(data),label);
});

test('the shared legacy presentation expands app totals without nesting VirtualizedLists',async()=>{
  const mocks={},r=createRenderer(mocks);
  mocks['./styles']=r.load('src/components/UsageTimePanel/styles.js');
  mocks['../DashboardComponents/Categoria/styles']=r.load('src/components/DashboardComponents/Categoria/styles.js');
  const apps=Array.from({length:14},(_,i)=>({label:'Loja de teste '+(i+1),seconds:140-i}));
  r.mount(r.load('src/components/UsageTimePanel/UsageTimeCard.js').default,{scope:'2026-11',period:'novembro de 2026',total:1869,apps,state:{kind:'DATA'}});
  assert.doesNotMatch(screenText(r),/Loja de teste 5/);
  getButton(r,'Ver todos').props.onPress();await r.flush();
  assert.match(screenText(r),/Loja de teste 5/);assert.match(screenText(r),/Loja de teste 14/);
  getButton(r,'Recolher aplicativos').props.onPress();await r.flush();assert.doesNotMatch(screenText(r),/Loja de teste 5/);
  assert.equal(r.nodes(n=>['FlatList','SectionList','VirtualizedList','ScrollView'].includes(n.type)).length,0);r.unmount();
});

for(const compact of [false,true]) test(`legacy presentation also uses real scoped values and has no technical blocks: compact=${compact}`,()=>{
  const mocks={
    '../../utils/tempoUsoSync':{obterJanelaDiaLocal:()=>({dataLocal:today})},
    '../../../utils/tempoUsoSync':{obterJanelaDiaLocal:()=>({dataLocal:today})},
  };
  const r=createRenderer(mocks);
  mocks['./styles']=r.load('src/components/UsageTimePanel/styles.js');
  mocks['../DashboardComponents/Categoria/styles']=r.load('src/components/DashboardComponents/Categoria/styles.js');
  const rows=[{tempo_uso_nome:'Loja de teste A',tempo_uso_data_local:today,tempo_uso_duracao_segundos:120},{tempo_uso_nome:'Loja de teste B',tempo_uso_data_local:'2026-11-06',tempo_uso_duracao_segundos:60}];
  const path=compact?'src/components/HomeComponents/TempoUsoHome.js':'src/components/DashboardComponents/TempoApp/index.js';
  r.mount(r.load(path).default,compact?{estado:'DISPONIVEL',registros:rows}:{tempoUso:rows,mes:'2026-11'});
  assert.match(screenText(r),compact?/TEMPO REGISTRADO HOJE/:/Tempo registrado no mês/);
  assert.match(screenText(r),compact?/2 min/:/3 min/);
  assert.doesNotMatch(screenText(r),/sincroniz|cobertura|fonte|entradas|retomadas|aplicativos acompanhados/i);
  if(compact)assert.doesNotMatch(screenText(r),/Loja de teste B/);
  assert.equal(r.nodes(n=>n.props?.testID==='usage-app-bar').length,compact?0:2);r.unmount();
});
