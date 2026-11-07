import assert from 'node:assert/strict';
import test from 'node:test';
import {validateUsagePeriod} from '../src/utils/usageMonitoringPresentation.js';
function period(){return {schemaVersion:2,summary:{schemaVersion:2,localMonth:'2026-11',totalRegisteredSeconds:null,installationCount:1,
  sourceTotals:{v2RegisteredSeconds:0,legacyRegisteredSeconds:60},availability:'AMBIGUOUS',coverage:'PARTIAL',semantics:'SUM_OF_REGISTERED_APP_TIME_NOT_EXCLUSIVE_PERSON_TIME'},
  installations:[{installationId:'one',registeredSeconds:0,suppressed:true}],legacy:[],observations:[{associationId:'a',localDate:'2026-11-02',timezone:'America/Sao_Paulo',observedAt:'2026-11-02T18:00:00Z',sourceStatus:'AVAILABLE',applications:[
    {packageId:'com.shopee.br',durationSeconds:null,suppression:{reason:'DELETED_INTERVAL',tombstoneIds:['t']}},
    {packageId:'com.zzkko',durationSeconds:0,suppression:null}]}]};}
test('v2 dashboard distinguishes suppressed, zero observed and ambiguous total',()=>{const p=period();assert.equal(validateUsagePeriod(p),p);assert.equal(p.observations[0].applications[0].durationSeconds,null);});
test('v2 dashboard rejects fabricated consolidated total and malformed suppression',()=>{
  const p=period();p.summary.totalRegisteredSeconds=60;assert.throws(()=>validateUsagePeriod(p),/INVALID_SUMMARY/);
  const q=period();q.observations[0].applications[0].suppression=null;assert.throws(()=>validateUsagePeriod(q),/INVALID_APPLICATION/);
});

test('precisão em milissegundos não transforma fonte ambígua ou duração desconhecida em total confirmado',()=>{
  const p=period();p.summary.totalRegisteredMs=299;assert.throws(()=>validateUsagePeriod(p),/INVALID_SUMMARY/);
  const q=period();q.observations[0].applications[1].durationMs=null;assert.throws(()=>validateUsagePeriod(q),/INVALID_APPLICATION/);
});
test('v2 dashboard does not convert source-unavailable observations into zero',()=>{
  const p=period();const previous=p.observations[0];p.observations[0]={...previous,sourceStatus:'UNAVAILABLE',applications:null,lastAvailable:previous};assert.equal(validateUsagePeriod(p),p);
  p.observations[0].applications=[];assert.throws(()=>validateUsagePeriod(p),/INVALID_OBSERVATION/);
});

test('v2 unavailable source only claims preservation when a previous snapshot exists', async()=>{
  const {usageObservationLabel,usageMonitoringLabel}=await import('../src/utils/usageMonitoringPresentation.js');
  assert.match(usageObservationLabel({sourceStatus:'UNAVAILABLE',lastAvailable:null}),/sem registro anterior/);
  assert.match(usageObservationLabel({sourceStatus:'UNAVAILABLE',lastAvailable:{}}),/preservado/);
  for(const status of ['PENDING','CONSENT_REQUIRED','PERMISSION_REQUIRED','ACTIVATION_REQUIRED','ERROR','DISABLED'])assert.ok(usageMonitoringLabel(status));
  assert.match(usageMonitoringLabel('READY'),/PLENNA aberto/);
});
