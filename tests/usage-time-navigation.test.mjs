import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRenderer} from './helpers/componentRenderer.mjs';

const source=readFileSync('src/pages/DashboardScreen/index.js','utf8').replace(/\r\n/g,'\n');
// Exercise the actual existing-screen hooks, with native measurement and HTTP
// replaced. No application startup, Android collection or network is involved.
const helpers=new Function(source.slice(source.indexOf('function parseMonth('),source.indexOf('function ComparisonPeriodTag('))+';return {isValidMonth,compareMonths,shiftMonth};')();
const start=source.indexOf('  useEffect(() => {\n    if (!isValidMonth(incomingPeriod)');
const end=source.indexOf('  const openPicker',start);
assert.ok(start>0&&end>start);
const navigationHooks=new Function('React','ctx',`const {useEffect,useCallback}=React;
 const {isValidMonth,compareMonths,shiftMonth,isFocused,overviewSection,incomingPeriod,currentMonth,accountStartMonth,usageFocusRequest,routeIndicator,selectedMonth,setSelectedMonth,setEvolutionEnd,setCompareMonthB,setCompareMonthA,activeTab,setActiveTab,pendingOverviewSectionRef,overviewSectionPositionsRef,overviewMeasurementVersionRef,overviewSectionNodesRef,overviewContentRef,overviewScrollRef,overviewLoading,financeiro,tempoUsoLoading,navigation}=ctx;
 ${source.slice(start,end)};return {mark,measureOverviewSection};`);

function harness(initial={}) {
 const r=createRenderer(),calls=[],params=[],measurements=[],comparisonChanges=[];
 let methods,month,tab,setMonth;
 function Host(props) {
  const [selectedMonth,setSelectedMonth]=r.React.useState(props.initialMonth??'2026-10');
  const [activeTab,setActiveTab]=r.React.useState(1);
  month=selectedMonth;tab=activeTab;setMonth=setSelectedMonth;
  const refs=Object.fromEntries(['pendingOverviewSection','overviewSectionPositions','overviewMeasurementVersion','overviewSectionNodes','overviewContent','overviewScroll'].map(name=>[name+'Ref',r.React.useRef(name==='overviewMeasurementVersion'?0:name==='pendingOverviewSection'?null:{})]));
  refs.overviewScrollRef.current={scrollTo:value=>calls.push(value)};
  refs.overviewSectionNodesRef.current.tempo={measureLayout:(_relative,callback)=>measurements.push(callback)};
  methods=navigationHooks(r.React,{...helpers,...refs,
   isFocused:true,overviewSection:props.indicator===null?null:'tempo',incomingPeriod:props.period,
   currentMonth:'2026-11',accountStartMonth:'2026-01',usageFocusRequest:props.request??1,
   routeIndicator:props.indicator===null?undefined:'tempo',selectedMonth,setSelectedMonth,activeTab,setActiveTab,setEvolutionEnd(){comparisonChanges.push('end');},setCompareMonthA(){comparisonChanges.push('a');},setCompareMonthB(){comparisonChanges.push('b');},
   overviewLoading:props.loading??true,financeiro:{loading:props.financialLoading??false},tempoUsoLoading:false,
   navigation:{setParams:value=>params.push(value)},
  });
  return null;
 }
 r.mount(Host,{period:'2026-11',...initial});
 return {...r,calls,params,measurements,comparisonChanges,get month(){return month;},get tab(){return tab;},setMonth:value=>setMonth(value),
  layout:y=>methods.mark('tempo')({nativeEvent:{layout:{y}}}),
  content:()=>methods.measureOverviewSection(),
  measured:y=>measurements.splice(0).forEach(callback=>callback(0,y)),
 };
}

test('details selects overview/current month and waits for async loading and native measurement',async()=>{
 const h=harness();await h.flush();assert.equal(h.month,'2026-11');assert.equal(h.tab,0);
 h.layout(100);assert.equal(h.calls.length,0);
 h.update({loading:false,financialLoading:true});await h.flush();h.measured(500);assert.equal(h.calls.length,0);
 h.update({financialLoading:false});await h.flush();h.measured(820);
 assert.deepEqual(h.calls,[{y:808,animated:true}]);assert.equal(h.params.length,1);
 assert.deepEqual(h.params[0],{indicador:undefined,periodo:undefined,focoTempo:undefined});
 // Later content/measurement changes must not pull the user back to this card.
 h.content();h.layout(900);assert.equal(h.calls.length,1);h.unmount();
});

test('consumed request never resets a manually selected month; a fresh details request can navigate again',async()=>{
 const h=harness({initialMonth:'2026-11',loading:false});await h.flush();h.measured(600);
 assert.equal(h.month,'2026-11');assert.equal(h.calls.length,1);
 assert.deepEqual(h.comparisonChanges,[]);
 h.update({indicator:null,period:undefined,request:undefined});await h.flush();
 h.setMonth('2026-09');await h.flush();h.layout(700);h.content();
 assert.equal(h.month,'2026-09');assert.equal(h.calls.length,1);
 h.update({indicator:'tempo',period:'2026-11',request:2});await h.flush();h.measured(810);
 assert.equal(h.month,'2026-11');assert.equal(h.calls.length,2);h.unmount();
});

test('late native callbacks from a previous navigation request cannot scroll a new request',async()=>{
 const h=harness({loading:false});await h.flush();const old=h.measurements.splice(0);
 h.update({indicator:null,period:undefined,request:undefined});await h.flush();
 old.forEach(callback=>callback(0,2000));assert.equal(h.calls.length,0);h.unmount();
});

test('Home routes details through its existing Dashboard tab with the current month',()=>{
 const home=readFileSync('src/pages/HomeScreen/index.js','utf8');
 const body=home.slice(home.indexOf('  const openUsageDetails ='),home.indexOf('  const refetchAllData'));
 const calls=[];
 const action=new Function('navigation','obterJanelaDiaLocal',body+';return openUsageDetails;')({navigate:(...args)=>calls.push(args)},()=>({dataLocal:'2026-12-01'}));
 action();assert.equal(calls[0][0],'Dashboard');assert.equal(calls[0][1].indicador,'tempo');assert.equal(calls[0][1].periodo,'2026-12');
 assert.match(home,/<UsageTimePanel[^\n]*onDetails=\{openUsageDetails\}/);
 assert.doesNotMatch(source,/setTimeout\([^)]*scrollTo/);
});
