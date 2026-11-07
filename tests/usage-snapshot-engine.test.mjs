import assert from 'node:assert/strict';
import test from 'node:test';
import {createUsageSnapshotEngine,buildUsageWindows} from '../src/services/usageSnapshotEngine.js';
process.env.TZ='America/Sao_Paulo';
function fixture(){
  const session={id:1,signal:new AbortController().signal};let controller=new AbortController();session.signal=controller.signal;
  const state={active:true,permission:true,timezone:'America/Sao_Paulo',sent:[],queries:[],updates:0,fail:false,
    association:{id:'episode-A',installationId:'install',state:'ACTIVE',eligibleFrom:'2026-11-02T17:00:00Z',timezone:'America/Sao_Paulo'}};
  const d={session:async()=>session,assertSession:id=>{if(id!==session.id||session.signal.aborted)throw new Error('SESSION_INVALIDATED');},active:()=>state.active,
    permission:async()=>state.permission,identity:async()=>({id:'install',secret:'a'.repeat(64),needsNewEpisode:false}),uuid:(()=>{let n=0;return()=>`operation-${++n}`;})(),
    timezone:()=>state.timezone,state:async()=>({association:state.association,consentActive:true}),
    associate:async()=>({schemaVersion:2,serverTime:'2026-11-02T18:00:00Z',association:state.association,revisions:[{localDate:'2026-11-02',revision:4}]}),
    rememberAssociation:async()=>{},close:async()=>{},catalog:async()=>({versao:1,aplicativos:[{packageId:'com.shopee.br'}]}),
    collect:async windows=>{state.queries.push(windows);if(state.onCollect)await state.onCollect();return windows.map(()=>({sourceStatus:'AVAILABLE',qualityFlags:[],applications:[{packageId:'com.shopee.br',durationSeconds:0}]}));},
    send:async payload=>{state.sent.push(payload);if(state.fail)throw new Error('NETWORK');return {schemaVersion:2};},updated:()=>state.updates++};
  const engine=createUsageSnapshotEngine(d);
  return {engine,state,d,logout(){controller.abort();session.id++;controller=new AbortController();session.signal=controller.signal;}};
}
test('v2 synchronization clips 14h authorization, sends revision 5 and preserves observed zero',async()=>{
  const h=fixture();await h.engine.run();assert.equal(h.state.queries.length,1);
  assert.deepEqual(h.state.queries[0],[{start:Date.parse('2026-11-02T17:00:00Z'),end:Date.parse('2026-11-02T18:00:00Z')}]);
  const s=h.state.sent[0].snapshots[0];assert.equal(s.revision,5);assert.equal(s.applications[0].durationSeconds,0);assert.equal(s.coverage.dayExtent,'PARTIAL_DAY');
});
test('v2 concurrent executions share collection; background/logout cancel native results',async()=>{
  const h=fixture();await Promise.all([h.engine.run(),h.engine.run()]);assert.equal(h.state.queries.length,1);assert.equal(h.state.sent.length,1);
  const bg=fixture();bg.state.onCollect=()=>{bg.state.active=false;};await assert.rejects(bg.engine.run(),/CANCELLED/);assert.equal(bg.state.sent.length,0);
  const logout=fixture();logout.state.onCollect=()=>logout.logout();await assert.rejects(logout.engine.run(),/INVALIDATED|CANCELLED/);assert.equal(logout.state.sent.length,0);
});
test('v2 offline failure before association prevents native query and no snapshot queue is persisted',async()=>{
  const h=fixture();h.d.state=async()=>{throw new Error('OFFLINE');};await assert.rejects(h.engine.run(),/OFFLINE/);assert.equal(h.state.queries.length,0);
  const recovered=fixture();await recovered.engine.run();assert.equal(recovered.state.sent.length,1);
});
test('v2 denied/restored permission, remote revocation and timezone changes block attribution',async()=>{
  const h=fixture();h.state.permission=false;await assert.rejects(h.engine.run(),/USAGE_ACCESS/);assert.equal(h.state.queries.length,0);
  h.state.permission=true;await h.engine.run();assert.equal(h.state.sent.length,1);
  const tz=fixture();tz.state.onCollect=()=>{tz.state.timezone='America/New_York';};await assert.rejects(tz.engine.run(),/TIMEZONE/);assert.equal(tz.state.sent.length,0);
  const revoked=fixture();let calls=0;revoked.d.state=async()=>({association:revoked.state.association,consentActive:++calls<2});await assert.rejects(revoked.engine.run(),/ASSOCIATION_CHANGED/);assert.equal(revoked.state.sent.length,0);
});
test('v2 lost response retries identical in-memory batch; session change discards uncertain payload',async()=>{
  const h=fixture();h.state.fail=true;await assert.rejects(h.engine.run(),/NETWORK/);h.state.fail=false;await h.engine.run();
  assert.deepEqual(h.state.sent[0],h.state.sent[1]);assert.equal(h.state.queries.length,1);
  const next=fixture();next.state.fail=true;await assert.rejects(next.engine.run());next.logout();next.state.fail=false;await next.engine.run();
  assert.notEqual(next.state.sent[0].batchId,next.state.sent[1].batchId);
});
test('v2 unavailable native source is not converted to zero; invalid durations fail before sending',async()=>{
  const h=fixture();h.d.collect=async windows=>windows.map(()=>({sourceStatus:'UNAVAILABLE',reason:'SOURCE_UNAVAILABLE'}));await h.engine.run();
  assert.equal(h.state.sent[0].snapshots[0].applications,null);assert.equal(h.state.sent[0].snapshots[0].sourceStatus,'UNAVAILABLE');
  const bad=fixture();bad.d.collect=async()=>[{sourceStatus:'AVAILABLE',qualityFlags:[],applications:[{packageId:'com.shopee.br',durationSeconds:3601}]}];await assert.rejects(bad.engine.run(),/INVALID_NATIVE/);assert.equal(bad.state.sent.length,0);
});
test('v2 recovery is D0/D-1/D-2 only and local DST days retain 23/25-hour boundaries',()=>{
  const a={timezone:'America/Sao_Paulo',eligibleFrom:'2026-10-01T00:00:00Z'};
  const windows=buildUsageWindows(a,'2026-11-02T18:00:00Z',a.timezone);assert.equal(windows.length,3);assert.equal(windows[2].localDate,'2026-10-31');
  process.env.TZ='America/New_York';
  for(const [now,day,hours]of[['2026-03-09T12:00:00Z','2026-03-08',23],['2026-11-02T12:00:00Z','2026-11-01',25]]){
    const w=buildUsageWindows({timezone:'America/New_York',eligibleFrom:'2026-01-01T00:00:00Z'},now,'America/New_York').find(w=>w.localDate===day);
    assert.equal((w.end-w.start)/3600000,hours);
  }
  process.env.TZ='America/Sao_Paulo';
});

test('v2 inactive consent blocks before identity, Android query or association', async()=>{
  const h=fixture();let touched=false;
  h.d.consent=async()=>false;h.d.identity=async()=>{touched=true;throw Error('MUST_NOT_RUN');};
  await assert.rejects(h.engine.run({activate:true}),/CONSENT_REQUIRED/);
  assert.equal(touched,false);assert.equal(h.state.queries.length,0);assert.equal(h.state.sent.length,0);
});
test('v2 expected session blocks delayed activation after account switch',async()=>{
  const h=fixture();h.logout();
  await assert.rejects(h.engine.run({activate:true,expectedSessionId:1}),/SESSION_INVALIDATED/);
  assert.equal(h.state.queries.length,0);
});
test('v2 remote inactive consent blocks before closing or associating',async()=>{
  const h=fixture();h.d.state=async()=>({consentActive:false,association:h.state.association});
  h.d.associate=async()=>{throw Error('MUST_NOT_ASSOCIATE');};
  await assert.rejects(h.engine.run(),/CONSENT_REQUIRED/);assert.equal(h.state.queries.length,0);
});
test('v2 permission revoked after association blocks before collecting',async()=>{
  const h=fixture();let calls=0;h.d.permission=async()=>++calls===1;
  await assert.rejects(h.engine.run(),/USAGE_ACCESS_REQUIRED/);assert.equal(h.state.queries.length,0);
});

test('v2 resume waits for obsolete native operation and starts fresh after foreground',async()=>{
 const h=fixture();let release;h.state.onCollect=()=>new Promise(r=>{release=r;});
 const old=h.engine.run();for(let i=0;i<20;i++)await new Promise(setImmediate);
 h.engine.stop();const resumed=h.engine.run();h.state.onCollect=null;release();
 await assert.rejects(old,/CANCELLED/);await resumed;assert.equal(h.state.queries.length,2);assert.equal(h.state.sent.length,1);
});

test('SHEIN eligible catalog package reaches native query and corrected snapshot',async()=>{
  const h=fixture();let selected;
  h.d.catalog=async()=>({versao:1,aplicativos:[{packageId:'com.zzkko',nomeApp:'SHEIN'}]});
  h.d.collect=async(windows,packages)=>{selected=packages;return windows.map(()=>({sourceStatus:'AVAILABLE',qualityFlags:[],applications:[{packageId:'com.zzkko',durationSeconds:42}]}));};
  await h.engine.run();assert.deepEqual(selected,['com.zzkko']);
  assert.equal(h.state.sent[0].snapshots[0].applications[0].durationSeconds,42);
});

test('catalog does not allow an unlisted native package to enter a snapshot',async()=>{
  const h=fixture();h.d.collect=async()=>[{sourceStatus:'AVAILABLE',qualityFlags:[],applications:[{packageId:'com.zzkko',durationSeconds:42}]}];
  await assert.rejects(h.engine.run(),/INVALID_NATIVE_RESPONSE/);assert.equal(h.state.sent.length,0);
});

test('remote 503 before association is diagnosed before any native collection',async()=>{
  const h=fixture(),events=[];h.d.diagnostic=(stage,outcome)=>events.push([stage,outcome]);
  h.d.state=async()=>{throw Object.assign(Error('unavailable'),{response:{status:503}});};
  await assert.rejects(h.engine.run(),error=>error.usageMonitoringStage==='STATE');
  assert.equal(h.state.queries.length,0);assert.equal(h.state.sent.length,0);
  assert.deepEqual(events.at(-1),['STATE','FAILED']);
});

test('native failure and rejected persistence carry separate safe stage markers',async()=>{
  const native=fixture();native.d.collect=async()=>{throw Error('native unavailable');};
  await assert.rejects(native.engine.run(),error=>error.usageMonitoringStage==='COLLECTION');
  const persistence=fixture();persistence.d.send=async()=>{throw Object.assign(Error('rejected'),{response:{status:409}});};
  await assert.rejects(persistence.engine.run(),error=>error.usageMonitoringStage==='INGESTION');
});
