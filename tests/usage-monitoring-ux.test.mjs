import test from 'node:test';
import assert from 'node:assert/strict';
import { usageTodayData, usagePeriodMetrics, usageLastUpdate } from '../src/utils/usageMonitoringView.js';

const observation = (localDate, ms, extra = {}) => ({associationId:'a', localDate, observedAt:localDate+'T15:00:00Z', sourceStatus:'AVAILABLE', applications:[{packageId:'com.zzkko',durationMs:ms,durationSeconds:ms/1000,suppression:null}], ...extra});
function fixture() {
  return {summary:{availability:'PARTIAL',totalRegisteredMs:90000,sourceTotals:{v2RegisteredMs:90000}}, observations:[observation('2026-11-05',60000),observation('2026-11-06',30000)],legacy:[],accessStats:{identifiedOpenings:50}};
}
test('Home uses only today, preserving the monthly source and never reusing monthly entry counts',()=>{
  const data=fixture();
  const today=usageTodayData(data,'2026-11-06');
  assert.equal(usagePeriodMetrics(today).total,30);
  assert.equal(today.accessStats,null);
  assert.equal(usagePeriodMetrics(data).total,90);
  assert.equal(today.observations.length,1);
  data.dailyAccessStats={identifiedOpenings:2};data.dailyAccessDate='2026-11-06';
  assert.equal(usageTodayData(data,'2026-11-06').accessStats.identifiedOpenings,2);
  assert.equal(usageTodayData(data,'2026-11-07').accessStats,null);
  assert.equal(usageTodayData(data,'2026-11-07').summary.availability,'NO_DATA');
});
test('observed zero, missing source and deletions remain distinct',()=>{
  const data=fixture();data.observations=[observation('2026-11-06',0)];
  assert.equal(usagePeriodMetrics(usageTodayData(data,'2026-11-06')).total,0);
  data.observations=[observation('2026-11-06',0,{sourceStatus:'UNAVAILABLE',applications:null})];
  assert.equal(usagePeriodMetrics(usageTodayData(data,'2026-11-06')).total,null);
  data.observations=[observation('2026-11-06',0,{applications:[{packageId:'com.zzkko',durationMs:null,durationSeconds:null,suppression:{reason:'DELETED_INTERVAL'}}]})];
  assert.equal(usagePeriodMetrics(usageTodayData(data,'2026-11-06')).total,null);
});
test('last update uses the available reading, never the time of a failed query',()=>{
  const data=fixture();const before=usageLastUpdate(data);
  data.observations=[{sourceStatus:'UNAVAILABLE',observedAt:'2026-11-07T18:00:00Z',lastAvailable:data.observations[1]}];
  assert.equal(usageLastUpdate(data),before);
  assert.equal(usageLastUpdate({observations:[]}),null);
});
test('daily legacy values remain separate from v2 values',()=>{
  const data=fixture();data.legacy=[{tempo_uso_data_local:'2026-11-06',tempo_uso_duracao_segundos:10},{tempo_uso_data_local:'2026-11-05',tempo_uso_duracao_segundos:999}];
  const today=usageTodayData(data,'2026-11-06');
  assert.equal(today.summary.sourceTotals.legacyRegisteredSeconds,10);
  assert.equal(today.summary.totalRegisteredMs,null);
});
test('Home preserves API ambiguity between sources and installations',()=>{
  const data=fixture();data.summary.availability='AMBIGUOUS';data.summary.totalRegisteredMs=null;
  const today=usageTodayData(data,'2026-11-06');
  assert.equal(today.summary.totalRegisteredMs,null);
  assert.equal(today.summary.availability,'AMBIGUOUS');
});
