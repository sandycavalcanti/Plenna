import assert from 'node:assert/strict';
import test from 'node:test';
import {createRenderer} from './helpers/componentRenderer.mjs';
const deferred=()=>{let resolve;return {promise:new Promise(r=>{resolve=r;}),resolve:value=>resolve(value)};};
async function flush(r){for(let i=0;i<8;i++)await r.flush();}
async function periodHarness(){
  const changes=new Set(),statuses=new Set(),consents=new Set(),appListeners=new Set();
  let controller=new AbortController();
  let session={id:1,signal:controller.signal};
  const state={reads:[],monitoring:'READY',monitorReads:0,reader:async month=>({month}),latest:null};
  let r;
  r=createRenderer({
    'react-native':{AppState:{addEventListener:(_,fn)=>{appListeners.add(fn);return {remove:()=>appListeners.delete(fn)};}}},
    '@react-navigation/native':{useFocusEffect:fn=>r.React.useEffect(fn,[fn])},
    '../api/tokenStorage':{tokenStorage:{captureSession:async()=>session,assertSession:id=>{if(id!==session.id||session.signal.aborted)throw Error('SESSION_INVALIDATED');}}},
    '../api/client':{apiClient:{get:async(url,config)=>{state.dayReads ??= [];state.dayReads.push(config.params);if(state.dayError)throw Error('OFFLINE');return {data:{schemaVersion:3,date:config.params.date,stats:{identifiedOpenings:2,identifiedResumptions:1,unknownEntries:0}}};}}},
    '../services/usageMonitoringService':{readUsageMonitoringPeriod:async(month,s,signal)=>{state.reads.push({month,sessionId:s.id,signal});return state.reader(month);},readUsageMonitoringStatus:async()=>{state.monitorReads++;return state.monitoringReader?state.monitoringReader():state.monitoring;}},
    '../utils/tempoUsoAtualizacao':{observarAtualizacaoTempoUso:fn=>{changes.add(fn);return()=>changes.delete(fn);}},
    '../utils/usageMonitoringStatus':{observeUsageSyncState:fn=>{statuses.add(fn);return()=>statuses.delete(fn);},usageSyncState:()=>({status:state.monitoring})},
    '../api/consentimento':{observarAlteracaoMonitoramento:fn=>{consents.add(fn);return()=>consents.delete(fn);}},
  });
  const {useUsageMonitoringPeriod}=r.load('src/hooks/useUsageMonitoringPeriod.js');
  const Component=({month,day})=>{state.latest=useUsageMonitoringPeriod(month,day);return r.React.createElement('Text',{},month);};
  r.mount(Component,{month:'2026-11'});await flush(r);
  return {r,state,changes,statuses,consents,appListeners,session:()=>session,changeAccount:()=>{controller.abort();controller=new AbortController();session={id:session.id+1,signal:controller.signal};}};
}
test('read failure preserves only actual history from the same selected month',async()=>{
  const h=await periodHarness();assert.equal(h.state.latest.data.month,'2026-11');
  h.state.reader=async()=>{throw Error('NETWORK');};await h.state.latest.refresh();await flush(h.r);
  assert.equal(h.state.latest.data.month,'2026-11');assert.equal(h.state.latest.readError,true);h.r.unmount();
});
test('switching month immediately hides old values and discards the previous response',async()=>{
  const h=await periodHarness(),november=deferred(),october=deferred();
  h.state.reader=month=>month==='2026-11'?november.promise:october.promise;
  h.state.latest.refresh();await flush(h.r);
  h.r.update({month:'2026-10'});assert.equal(h.state.latest.data,null);await flush(h.r);
  november.resolve({month:'2026-11'});await flush(h.r);assert.equal(h.state.latest.data,null);
  october.resolve({month:'2026-10'});await flush(h.r);assert.equal(h.state.latest.data.month,'2026-10');h.r.unmount();
});
test('account switch clears history and prevents obsolete response from reaching the new account',async()=>{
  const h=await periodHarness(),old=deferred();h.state.reader=()=>old.promise;
  h.state.latest.refresh();await flush(h.r);h.changeAccount();await flush(h.r);assert.equal(h.state.latest.data,null);
  old.resolve({account:'previous'});await flush(h.r);assert.equal(h.state.latest.data,null);
  h.state.reader=async()=>({account:'current'});await h.state.latest.refresh();await flush(h.r);assert.equal(h.state.latest.data.account,'current');h.r.unmount();
});
test('sync progress does not trigger a history-query storm; confirmed update refreshes once',async()=>{
  const h=await periodHarness(),initial=h.state.reads.length,monitorReads=h.state.monitorReads;
  h.state.monitoring='SYNCING';for(const fn of h.statuses)fn({sessionId:h.session().id,status:'SYNCING'});await flush(h.r);
  assert.equal(h.state.reads.length,initial);assert.equal(h.state.latest.monitoring,'SYNCING');
  assert.equal(h.state.monitorReads,monitorReads);
  for(const fn of h.statuses)fn({sessionId:999,status:'CONSENT_REQUIRED'});await flush(h.r);assert.equal(h.state.latest.monitoring,'SYNCING');
  for(const fn of h.changes)fn();await flush(h.r);assert.equal(h.state.reads.length,initial+1);h.r.unmount();
});

test('uma leitura antiga não sobrescreve revogação confirmada pelo evento da sessão',async()=>{
  const h=await periodHarness(),old=deferred();h.state.monitoringReader=()=>old.promise;
  await h.state.latest.refresh();await flush(h.r);
  for(const fn of h.statuses)fn({sessionId:h.session().id,status:'CONSENT_REQUIRED'});await flush(h.r);
  old.resolve('READY');await flush(h.r);assert.equal(h.state.latest.monitoring,'CONSENT_REQUIRED');h.r.unmount();
});

test('revogar horários retira métricas detalhadas em memória e preserva os acumulados anteriores',async()=>{
  const h=await periodHarness();h.state.reader=async()=>({month:'2026-11',accessStats:{identifiedOpenings:2},observations:[{durationMs:299}]});await h.state.latest.refresh();await flush(h.r);
  const old=deferred();h.state.reader=()=>old.promise;h.state.latest.refresh();await flush(h.r);
  for(const fn of h.consents)fn(h.session().id,{confirmed:true,code:'MONITORAMENTO_ACESSOS',status:false});await flush(h.r);
  old.resolve({month:'2026-11',accessStats:{identifiedOpenings:99},observations:[]});await flush(h.r);
  assert.equal(h.state.latest.data.accessStats,null);assert.equal(h.state.latest.data.observations[0].durationMs,299);h.r.unmount();assert.equal(h.consents.size,0);
});
test('return from settings revalidates status; cleanup removes focused listeners',async()=>{
  const h=await periodHarness();h.state.monitoring='PERMISSION_REQUIRED';for(const fn of h.appListeners)fn('active');await flush(h.r);
  assert.equal(h.state.latest.monitoring,'PERMISSION_REQUIRED');h.state.monitoring='READY';for(const fn of h.appListeners)fn('active');await flush(h.r);
  assert.equal(h.state.latest.monitoring,'READY');h.r.unmount();assert.equal(h.statuses.size,0);assert.equal(h.changes.size,0);assert.equal(h.appListeners.size,0);
});

test('summary-only cards never request individual access endpoints or refetch on an unchanged render',async()=>{
  const h=await periodHarness();const before=h.state.reads.length;
  h.r.update({month:'2026-11'});await flush(h.r);
  assert.equal(h.state.reads.length,before);
  assert.equal(h.state.dayReads,undefined);
  await h.state.latest.refresh();await flush(h.r);
  assert.equal(h.state.reads.length,before+1);
  assert.equal(h.state.dayReads,undefined);h.r.unmount();
});
