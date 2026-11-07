import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer} from './helpers/componentRenderer.mjs';
import {createMonitoringEngine} from '../src/services/monitoramentoEngine.js';

// Offline fixtures only. The real foreground hook, engine, period hook and cards
// run together; Android and HTTP boundaries are replaced, no database is created.
async function harness() {
 const changes=new Set(),listeners=new Set(),session={id:6,signal:new AbortController().signal};
 const state={nativeMs:0,knownMs:0,version:0,collects:0,submits:0,updates:0,runs:0,accesses:[],quality:8192};
 const app={currentState:'active',addEventListener:(_event,fn)=>{listeners.add(fn);return {remove:()=>listeners.delete(fn)};}};
 const snapshot=()=>({summary:{availability:'PARTIAL',localMonth:'2026-11',totalRegisteredMs:state.knownMs,sourceTotals:{v2RegisteredMs:state.knownMs,legacyRegisteredMs:null}},legacy:[],observations:[{associationId:'ctx',localDate:'2026-11-07',observedAt:'2026-11-07T14:34:04Z',sourceStatus:'AVAILABLE',applications:[{packageId:'com.shopee.br',durationMs:state.knownMs,suppression:null}]}]});
 const engine=createMonitoringEngine({
  session:async()=>session,assertSession:id=>assert.equal(id,session.id),active:()=>app.currentState==='active',permission:async()=>true,
  identity:async()=>({id:'installation',clientSession:'client',contextId:'ctx'}),timezone:()=> 'America/Sao_Paulo',remember:async()=>{},cancelNative(){},
  prepare:async()=>{if(state.blocked)throw Error(state.blocked);return {schemaVersion:3,timezone:'America/Sao_Paulo',contextId:'ctx',collectionId:'capture',eligibleFrom:'2026-11-07T14:33:18Z',detailedAccessAllowed:true,catalog:[{packageId:'com.shopee.br'}],windows:[{localDate:'2026-11-07',start:'2026-11-07T14:33:18Z',end:'2026-11-07T14:40:00Z'}],previous:state.version?[{localDate:'2026-11-07',packageId:'com.shopee.br',version:state.version,durationMs:state.knownMs}]:[]};},
  collect:async()=>{state.collects++;return [{sourceStatus:state.unavailable?'UNAVAILABLE':'AVAILABLE',collectorVersion:4,applications:[{packageId:'com.shopee.br',durationMs:state.nativeMs,quality:state.quality,accesses:state.accesses}]}];},
  submit:async body=>{state.submits++;if(state.rejectSubmit)throw Object.assign(Error('READ_ONLY'),{response:{status:503}});state.lastPayload=body;const o=body.observations[0];if(o.status==='AVAILABLE')state.knownMs=o.durationMs;state.version++;return {schemaVersion:3,results:[{localDate:o.localDate,packageId:o.packageId,version:state.version,status:'APPLIED'}]};},
  updated:()=>{state.updates++;for(const fn of changes)fn();},
 });
 let r;
 const service={synchronizeUsageMonitoring:()=>{state.runs++;return engine.run();},cancelUsageMonitoring:engine.stop,readUsageMonitoringPeriod:async()=>snapshot(),readUsageMonitoringStatus:async()=>state.blocked?'CONTROLLED_PAUSE':'READY'};
 r=createRenderer({
  'react-native':{...Object.fromEntries(['View','Text','Pressable','ActivityIndicator'].map(n=>[n,n])),StyleSheet:{create:v=>v},AppState:app},
  '@react-navigation/native':{useFocusEffect:fn=>r.React.useEffect(fn,[fn])},
  '../api/localValidationPolicy':{localValidation:{enabled:false}},'../api/usageMonitoringPolicy':{usageMonitoringEnabled:true},
  '../services/usageMonitoringService':service,'../../services/usageMonitoringService':service,
  '../api/tokenStorage':{tokenStorage:{captureSession:async()=>session,assertSession:id=>assert.equal(id,session.id)}},
  '../utils/tempoUsoAtualizacao':{observarAtualizacaoTempoUso:fn=>{changes.add(fn);return()=>changes.delete(fn);}},
  '../utils/usageMonitoringStatus':{observeUsageSyncState:()=>()=>{},usageSyncState:()=>({status:'READY'})},
  '../api/consentimento':{observarAlteracaoMonitoramento:()=>()=>{}},
  '../../utils/tempoUsoSync':{obterJanelaDiaLocal:()=>({dataLocal:'2026-11-07'})},
 });
 const useSync=r.load('src/hooks/useTempoUsoSync.js').useTempoUsoSync;
 const Panel=r.load('src/components/UsageTimePanel/index.js').default;
 function Screens(){useSync();return r.React.createElement('View',{},r.React.createElement(Panel,{compact:true,month:'2026-11'}),r.React.createElement(Panel,{month:'2026-11'}));}
 r.mount(Screens);
 const settle=async()=>{for(let i=0;i<12;i++)await r.flush();};await settle();
 const foreground=async()=>{for(const value of ['background','active']){app.currentState=value;for(const fn of [...listeners])fn(value);}await settle();};
 return {r,state,foreground,settle,totals:()=>r.nodes(n=>n.props?.testID==='usage-total').map(n=>n.props.children[0])};
}

test('first valid closed use reaches payload, acknowledged storage and both cards on the first return',async()=>{
 const h=await harness();assert.deepEqual(h.totals(),['0 s','0 s']);const before={runs:h.state.runs,collects:h.state.collects,submits:h.state.submits};
 h.state.nativeMs=26650;await h.foreground();
 assert.equal(h.state.lastPayload.observations[0].durationMs,26650);assert.equal(h.state.knownMs,26650);assert.deepEqual(h.totals(),['26 s','26 s']);
 assert.equal(h.state.runs,before.runs+1);assert.equal(h.state.collects,before.collects+1);assert.equal(h.state.submits,before.submits+1);h.r.unmount();
});

test('a second use replaces the cumulative total instead of duplicating the first interval',async()=>{
 const h=await harness();h.state.nativeMs=26650;await h.foreground();h.state.nativeMs=49108;await h.foreground();
 assert.equal(h.state.knownMs,49108);assert.deepEqual(h.totals(),['49 s','49 s']);assert.equal(h.state.lastPayload.observations[0].expectedVersion,2);h.r.unmount();
});

test('return without relevant use does not add time or require another return to show the previous total',async()=>{
 const h=await harness();h.state.nativeMs=26650;await h.foreground();await h.foreground();
 assert.equal(h.state.knownMs,26650);assert.deepEqual(h.totals(),['26 s','26 s']);h.r.unmount();
});

test('unavailable events are not converted into observed zero and cause no timer or extra collection',async()=>{
 const h=await harness();h.state.nativeMs=26650;await h.foreground();h.state.unavailable=true;const before=h.state.collects;await h.foreground();
 assert.equal(h.state.lastPayload.observations[0].status,'UNAVAILABLE');assert.equal(h.state.lastPayload.observations[0].durationMs,null);assert.equal(h.state.knownMs,26650);assert.equal(h.state.collects,before+1);assert.deepEqual(h.totals(),['26 s','26 s']);h.r.unmount();
});

test('closed lock/resumption evidence stays distinct in the payload and blocked time is not added',async()=>{
 const h=await harness(),origin=Date.parse('2026-11-07T14:34:00Z');
 h.state.nativeMs=1300;h.state.accesses=[{origin,start:origin,end:origin+1000,quality:1|2|256|2048},{origin:origin+3000,start:origin+3000,end:origin+3300,quality:1|2|512}];await h.foreground();
 const o=h.state.lastPayload.observations[0];assert.equal(o.durationMs,1300);assert.equal(o.accesses.length,2);assert.equal(o.accesses[1].quality&512,512);assert.equal(o.accesses[1].quality&256,0);h.r.unmount();
});

test('DONE and READ ONLY errors never acknowledge new monitoring data or publish an update',async()=>{
 const h=await harness(),before={collects:h.state.collects,updates:h.state.updates};h.state.nativeMs=26650;h.state.blocked='CONTROLLED_SYNC_FINISHED';await h.foreground();
 assert.equal(h.state.collects,before.collects);assert.equal(h.state.updates,before.updates);assert.equal(h.state.knownMs,0);
 h.state.blocked=null;h.state.rejectSubmit=true;await h.foreground();assert.equal(h.state.updates,before.updates);assert.equal(h.state.knownMs,0);h.r.unmount();
});
