import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveUsageView, usagePeriodMetrics, usageDuration } from '../src/utils/usageMonitoringView.js';
import { classifyUsageFailure, usageSyncState, publishUsageSyncState, observeUsageSyncState } from '../src/utils/usageMonitoringStatus.js';

export function usageFixture(){
  return {schemaVersion:2,summary:{availability:'PARTIAL',totalRegisteredSeconds:90,sourceTotals:{v2RegisteredSeconds:90,legacyRegisteredSeconds:null}},legacy:[],observations:[
    {associationId:'a',localDate:'2026-11-05',sourceStatus:'AVAILABLE',applications:[{packageId:'com.zzkko',durationSeconds:30,suppression:null}]},
    {associationId:'a',localDate:'2026-11-06',sourceStatus:'AVAILABLE',applications:[{packageId:'com.zzkko',durationSeconds:60,suppression:null}]},
  ]};
}
for(const [monitoring,kind] of [['CONSENT_REQUIRED','DISABLED'],['DISABLED','DISABLED'],['PERMISSION_REQUIRED','PERMISSION'],['ACTIVATION_REQUIRED','ACTIVATION'],['SYNCING','SYNCING'],['READY','READ_ERROR'],['SERVICE_UNAVAILABLE','SERVICE_UNAVAILABLE']]){
  test(`one primary state for ${monitoring}, even with read failure`,()=>{
    const result=resolveUsageView({data:null,loading:false,readError:true,monitoring});
    assert.equal(result.kind,kind);assert.equal(typeof result.message,'string');
  });
}
test('empty, pending, source unavailable, sync failure and available data stay distinct',()=>{
  const empty={summary:{availability:'NO_DATA'},observations:[]};
  assert.equal(resolveUsageView({data:empty,monitoring:'READY'}).kind,'EMPTY');
  assert.equal(resolveUsageView({data:empty,monitoring:'PENDING'}).kind,'PENDING');
  assert.equal(resolveUsageView({data:empty,monitoring:'ERROR'}).kind,'SYNC_ERROR');
  assert.equal(resolveUsageView({data:{...empty,observations:[{sourceStatus:'UNAVAILABLE'}]},monitoring:'READY'}).kind,'SOURCE_UNAVAILABLE');
  assert.equal(resolveUsageView({data:usageFixture(),monitoring:'READY'}).kind,'DATA');
});
test('observed zero is valid history, not absence; ambiguous sources never get a daily sum',()=>{
  const data=usageFixture();data.summary.totalRegisteredSeconds=0;
  assert.equal(resolveUsageView({data,monitoring:'READY'}).kind,'DATA');assert.equal(usageDuration(0),'0s');
  data.summary.sourceTotals.v2RegisteredSeconds=null;assert.deepEqual(usagePeriodMetrics(data).daily,[]);
});
test('SHEIN has a readable label; daily series reconciles with v2 without inserting absent days',()=>{
  const metrics=usagePeriodMetrics(usageFixture());assert.equal(metrics.ranking[0].label,'SHEIN');
  assert.equal(metrics.appCount,1);assert.equal(metrics.daily.length,2);assert.equal(metrics.daily.reduce((n,d)=>n+d.seconds,0),90);
});
test('suppressed applications never enter totals, app count or ranking',()=>{
  const data=usageFixture();data.observations[0].applications[0]={packageId:'com.zzkko',durationSeconds:null,suppression:{reason:'DELETED_INTERVAL'}};
  data.summary.sourceTotals.v2RegisteredSeconds=60;
  assert.equal(usagePeriodMetrics(data).daily[0].seconds,60);assert.equal(usagePeriodMetrics(data).ranking[0].value,1);
});
test('sync state is account-session scoped and independent of history update notifications',()=>{
  let count=0;const unsubscribe=observeUsageSyncState(()=>count++);
  publishUsageSyncState(101,'SYNCING');assert.equal(usageSyncState(101).status,'SYNCING');assert.equal(usageSyncState(202).status,'PENDING');
  unsubscribe();publishUsageSyncState(101,'READY');assert.equal(count,1);
});
test('errors distinguish permission, feature gate, native source and failed API stage',()=>{
  assert.equal(classifyUsageFailure(Error('USAGE_ACCESS_REQUIRED')).status,'PERMISSION_REQUIRED');
  assert.equal(classifyUsageFailure(Error('RF017_V2_NATIVE_REQUIRED')).status,'SOURCE_UNAVAILABLE');
  assert.equal(classifyUsageFailure({response:{status:503,data:{error:{code:'RF017_V2_NOT_ENABLED'}}}}).status,'SERVICE_DISABLED');
  assert.deepEqual(classifyUsageFailure({usageMonitoringStage:'INGESTION',response:{status:503}}),{status:'SERVICE_UNAVAILABLE',stage:'INGESTION',code:'REQUEST_FAILED'});
});
