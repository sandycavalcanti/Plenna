import test from 'node:test';
import assert from 'node:assert/strict';
import {createMonitoringEngine} from '../src/services/monitoramentoEngine.js';
function fixture(){
  const control=new AbortController(),state={active:true,sent:[],queries:0,cancelled:0,detail:true,fail:false};
  const session={id:1,signal:control.signal};
  const reply={schemaVersion:3,contextId:'ctx',collectionId:'capture',timezone:'America/Sao_Paulo',eligibleFrom:'2026-11-06T12:00:00Z',detailedAccessAllowed:true,catalog:[{packageId:'com.zzkko'}],windows:[{localDate:'2026-11-06',start:'2026-11-06T12:00:00Z',end:'2026-11-06T13:00:00Z'}],previous:[]};
  const d={session:async()=>session,assertSession:id=>{if(id!==session.id||control.signal.aborted)throw Error('SESSION_INVALIDATED');},active:()=>state.active,permission:async()=>true,identity:async()=>({id:'install',clientSession:'client',contextId:'ctx'}),timezone:()=>reply.timezone,prepare:async()=>({...reply,detailedAccessAllowed:state.detail}),remember:async()=>{},collect:async(w,p,e,details)=>{state.queries++;state.nativeDetailed=details;await state.onCollect?.();return [{sourceStatus:'AVAILABLE',collectorVersion:4,quality:8192,applications:[{packageId:'com.zzkko',durationMs:600000,quality:8192,accesses:[{origin:Date.parse('2026-11-06T12:10:00Z'),start:Date.parse('2026-11-06T12:10:00Z'),end:Date.parse('2026-11-06T12:20:00Z'),quality:1027}]}]}];},submit:async body=>{state.sent.push(body);if(state.fail){state.fail=false;throw Error('NETWORK');}return {schemaVersion:3,results:body.observations.map(o=>({localDate:o.localDate,packageId:o.packageId,version:o.expectedVersion+1,status:'APPLIED'}))};},cancelNative:()=>state.cancelled++,updated:()=>{}};
  return {d,state,reply,engine:createMonitoringEngine(d),control};
}
test('current engine produces typed observations and coalesces simultaneous foreground runs',async()=>{const h=fixture();await Promise.all([h.engine.run(),h.engine.run()]);assert.equal(h.state.queries,1);assert.equal(h.state.sent.length,1);assert.equal(h.state.sent[0].observations[0].durationMs,600000);});
test('lost response retries the exact bounded batch',async()=>{const h=fixture();h.state.fail=true;await h.engine.run();assert.equal(h.state.sent.length,2);assert.deepEqual(h.state.sent[0],h.state.sent[1]);});
test('background and logout discard results and cancel native work',async()=>{const h=fixture();h.state.onCollect=()=>{h.state.active=false;h.engine.stop();};await assert.rejects(h.engine.run(),/CANCELLED/);assert.equal(h.state.sent.length,0);assert.ok(h.state.cancelled>0);const l=fixture();l.state.onCollect=()=>l.control.abort();await assert.rejects(l.engine.run(),/INVALIDATED|CANCELLED/);assert.equal(l.state.sent.length,0);});
test('aggregate-only authorization does not request or send detailed accesses',async()=>{const h=fixture();h.state.detail=false;await h.engine.run();assert.equal(h.state.nativeDetailed,false);assert.deepEqual(h.state.sent[0].observations[0].accesses,[]);});
test('expired Android data is reported unavailable instead of correcting downward',async()=>{const h=fixture();h.reply.previous=[{localDate:'2026-11-06',packageId:'com.zzkko',version:4,durationMs:900000}];await h.engine.run();const o=h.state.sent[0].observations[0];assert.equal(o.status,'UNAVAILABLE');assert.equal(o.durationMs,null);assert.equal(o.expectedVersion,4);});
test('activation challenge is answered only during an explicit activation',async()=>{const h=fixture();let calls=0;h.d.prepare=async body=>{calls++;return body.activationProof==='proof'?h.reply:{schemaVersion:3,activationChallenge:'proof'};};await h.engine.run({activate:true});assert.equal(calls,2);});
test('malformed acknowledgement is not published as success',async()=>{const h=fixture();h.d.submit=async()=>({schemaVersion:3});let updates=0;h.d.updated=()=>updates++;await assert.rejects(h.engine.run(),/INVALID_INGESTION_RESPONSE/);assert.equal(updates,0);});


test('collector 4 preserves distinct lock segments, entry evidence and subsecond milliseconds',async()=>{
 const h=fixture(), start=Date.parse('2026-11-06T12:10:00Z');
 h.d.collect=async()=>[{collectorVersion:4,sourceStatus:'AVAILABLE',quality:8192,applications:[{packageId:'com.zzkko',quality:8192,durationMs:799,accesses:[
 {origin:start,start,end:start+299,quality:1|2|1024|4096},
 {origin:start+75000,start:start+75000,end:start+75500,quality:1|2|512}]}]}];
 await h.engine.run();const o=h.state.sent[0].observations[0];assert.equal(o.collectorVersion,4);assert.equal(o.durationMs,799);
 assert.notEqual(o.accesses[0].origin,o.accesses[1].origin);assert.equal(o.accesses[1].quality&256,0);assert.equal(o.accesses[1].quality&512,512);
});
test('an older native collector cannot silently send interval starts as collector 4 evidence',async()=>{
 const h=fixture();h.d.collect=async()=>[{sourceStatus:'AVAILABLE',quality:64,applications:[]}];
 await assert.rejects(h.engine.run(),/COLLECTOR_4_NATIVE_REQUIRED/);assert.equal(h.state.sent.length,0);
});

test('alteração de consentimento impede nova coleta e descarta resultado de coleta já iniciada',async()=>{
 const h=fixture();h.d.consentChanging=()=>true;
 await assert.rejects(h.engine.run(),/CONSENT_CHANGE_IN_PROGRESS/);assert.equal(h.state.queries,0);assert.equal(h.state.sent.length,0);
 const active=fixture();let changing=false;active.d.consentChanging=()=>changing;active.state.onCollect=()=>{changing=true;};
 await assert.rejects(active.engine.run(),/CONSENT_CHANGE_IN_PROGRESS/);assert.equal(active.state.sent.length,0);
});

test('ausência de consentimento no servidor, API indisponível e permissão negada não consultam eventos',async()=>{
 for(const code of ['CONSENT_REQUIRED','RF017_V2_NOT_ENABLED']){const h=fixture();h.d.prepare=async()=>{throw Error(code);};await assert.rejects(h.engine.run(),new RegExp(code));assert.equal(h.state.queries,0);assert.equal(h.state.sent.length,0);}
 const h=fixture();h.d.permission=async()=>false;await assert.rejects(h.engine.run(),/USAGE_ACCESS_REQUIRED/);assert.equal(h.state.queries,0);
 h.d.permission=async()=>true;await h.engine.run();assert.equal(h.state.queries,1);
});
