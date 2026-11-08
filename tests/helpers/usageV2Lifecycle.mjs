import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createUsageSnapshotEngine} from '../../src/services/usageSnapshotEngine.js';
export const settle=async()=>{for(let i=0;i<20;i++)await new Promise(setImmediate);};
export async function lifecycle(){
  let controller=new AbortController();
  const session={id:1,signal:controller.signal};
  const state={consent:false,permission:false,active:true,collections:0,sends:0,listeners:new Set(),effects:[]};
  const app={currentState:'active',addEventListener:(_,fn)=>{state.listeners.add(fn);return {remove:()=>state.listeners.delete(fn)};}};
  const association={id:'episode',installationId:'install',state:'ACTIVE',timezone:'America/Sao_Paulo',eligibleFrom:'2026-11-06T12:00:00Z'};
  const engine=createUsageSnapshotEngine({session:async()=>session,assertSession:id=>{if(id!==session.id||session.signal.aborted)throw Error('SESSION_INVALIDATED');},active:()=>state.active,
    consent:async()=>state.consent,permission:async()=>state.permission,identity:async()=>({id:'install'}),uuid:()=>String(Math.random()),timezone:()=>association.timezone,
    state:async()=>({association,consentActive:state.consent}),associate:async()=>({schemaVersion:2,association,serverTime:'2026-11-06T13:00:00Z'}),rememberAssociation:async()=>{},
    catalog:async()=>({versao:1,aplicativos:[{packageId:'app'}]}),collect:async windows=>{state.collections++;await state.gate;return windows.map(()=>({sourceStatus:'AVAILABLE',qualityFlags:[],applications:[{packageId:'app',durationSeconds:1}]}));},
    send:async()=>{state.sends++;return {};},updated:()=>{}});
  const context=vm.createContext({});
  const synthetic=async values=>{const m=new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v);},{context});await m.link(()=>{});await m.evaluate();return m;};
  const hook=new vm.SourceTextModule(await readFile(new URL('../../src/hooks/useTempoUsoSync.js',import.meta.url),'utf8'),{context});
  await hook.link(name=>synthetic(name==='react'?{useEffect:fn=>state.effects.push(fn)}:name==='react-native'?{AppState:app}:name.includes('localValidation')?{localValidation:{enabled:false}}:name.includes('Policy')?{usageMonitoringEnabled:true}:{synchronizeUsageMonitoring:()=>engine.run(),cancelUsageMonitoring:engine.stop}));await hook.evaluate();
  return {state,mount:()=>{hook.namespace.useTempoUsoSync();return state.effects.pop()();},foreground:()=>{for(const value of ['background','active']){app.currentState=value;state.active=value==='active';for(const fn of state.listeners)fn(value);}},logout:()=>controller.abort()};
}
export async function consentFlow(fail=false){
  const calls=[],session={id:1,signal:new AbortController().signal};
  const context=vm.createContext({});
  const synthetic=async values=>{const m=new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v);},{context});await m.link(()=>{});await m.evaluate();return m;};
  const source=await readFile(new URL('../../src/services/monitoramentoConsentService.js',import.meta.url),'utf8');
  const m=new vm.SourceTextModule(source,{context,importModuleDynamically:()=>synthetic({prepareUsageMonitoringActivation:async()=>calls.push('activate'),synchronizeUsageMonitoring:async()=>calls.push('sync')})});
  await m.link(()=>synthetic({usageMonitoringEnabled:true}));await m.evaluate();
  return {calls,run:()=>m.namespace.alterarConsentimentoMonitoramento(true,session,async(code,value)=>{calls.push([code,value]);if(fail)throw Error('OFFLINE');},()=>{})};
}
