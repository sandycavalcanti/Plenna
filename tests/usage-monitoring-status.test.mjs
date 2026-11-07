import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {classifyUsageFailure} from '../src/utils/usageMonitoringStatus.js';

async function harness(){
  const state={permission:true,consent:true,module:true,sync:'READY',permissionReads:0,collects:0};
  const session={id:1,signal:new AbortController().signal};
  const context=vm.createContext({Promise,JSON,Error});
  const forbidden=()=>{state.collects++;throw Error('COLLECTION_MUST_NOT_RUN');};
  const deps={
    'expo-secure-store':{getItemAsync:forbidden,setItemAsync:forbidden},
    'expo-crypto':{randomUUID:forbidden,getRandomBytesAsync:forbidden},
    'react-native':{AppState:{currentState:'active',addEventListener:()=>({remove(){}})}},
  };
  const synthetic=async values=>{const m=new vm.SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value);},{context});await m.link(()=>{});await m.evaluate();return m;};
  const service=new vm.SourceTextModule(await readFile(new URL('../src/services/usageMonitoringService.js',import.meta.url),'utf8'),{context});
  await service.link(name=>{
    if(deps[name])return synthetic(deps[name]);
    if(name.endsWith('/client'))return synthetic({apiClient:{get:forbidden,post:forbidden,put:forbidden}});
    if(name.endsWith('/tokenStorage'))return synthetic({tokenStorage:{assertSession:()=>{if(session.signal.aborted)throw Error('SESSION_INVALIDATED');},captureSession:async()=>session}});
    if(name.endsWith('/plenna-usage-stats'))return synthetic({getModuleStatus:async()=>({available:state.module}),hasUsageAccess:async()=>{state.permissionReads++;return state.permission;},getInstallationAnchor:forbidden,getUsageObservations:forbidden,cancelUsageCollection(){}});
    if(name.endsWith('/consentimento'))return synthetic({listarConsentimentos:async()=>{if(state.error)throw state.error;return [{consentimento_tipo_codigo:'MONITORAMENTO_TEMPO_USO',consentimento_status:state.consent}];},monitoramentoEmAlteracao:()=>false,observarAlteracaoMonitoramento:()=>()=>{}});
    if(name.endsWith('/monitoramentoEngine'))return synthetic({createMonitoringEngine:()=>({run:forbidden,stop(){}})});
    if(name.endsWith('/usageMonitoringPolicy'))return synthetic({usageMonitoringEnabled:true,usageMonitoringReadsEnabled:true,usageMonitoringHomologationEnabled:false});
    if(name.endsWith('/usageMonitoringStatus'))return synthetic({classifyUsageFailure,usageSyncState:()=>({status:state.sync}),publishUsageSyncState(){}});
    if(name.endsWith('/usageMonitoringDiagnostics'))return synthetic({usageDiagnostic(){}});
    if(name.endsWith('/usageMonitoringPresentation'))return synthetic({validateUsagePeriod:v=>v});
    if(name.endsWith('/usageInstallation'))return synthetic({installationCredential:forbidden});
    if(name.endsWith('/tempoUsoAtualizacao'))return synthetic({emitirAtualizacaoTempoUso(){}});
    throw Error(`UNMOCKED_BOUNDARY: ${name}`);
  });await service.evaluate();
  return {state,read:()=>service.namespace.readUsageMonitoringStatus(session),sync:()=>service.namespace.synchronizeUsageMonitoring()};
}

test('controlled pause blocks repeated synchronization before identity, native collection or network',async()=>{
  const h=await harness();h.state.sync='CONTROLLED_PAUSE';
  await assert.rejects(h.sync(),/CONTROLLED_SYNC_PAUSED/);
  await assert.rejects(h.sync(),/CONTROLLED_SYNC_PAUSED/);
  assert.equal(h.state.collects,0);assert.equal(h.state.permissionReads,0);
  assert.equal(await h.read(),'CONTROLLED_PAUSE');
});
test('return from Android settings clears stale permission denial even when consent API returns 503',async()=>{
  const h=await harness();h.state.sync='PERMISSION_REQUIRED';h.state.permission=false;
  assert.equal(await h.read(),'PERMISSION_REQUIRED');
  h.state.permission=true;h.state.error={response:{status:503}};
  assert.equal(await h.read(),'SERVICE_UNAVAILABLE');assert.equal(h.state.permissionReads,2);assert.equal(h.state.collects,0);
});
test('denied and revoked Android access is independently rechecked',async()=>{
  const h=await harness();assert.equal(await h.read(),'READY');h.state.permission=false;
  assert.equal(await h.read(),'PERMISSION_REQUIRED');h.state.permission=true;
  assert.equal(await h.read(),'READY');assert.equal(h.state.collects,0);
});
test('disabled consent has priority; missing native module never pretends it is denied access',async()=>{
  const h=await harness();h.state.permission=false;h.state.consent=false;assert.equal(await h.read(),'CONSENT_REQUIRED');
  h.state.consent=true;h.state.module=false;assert.equal(await h.read(),'SOURCE_UNAVAILABLE');
});
test('permission restored with active consent is pending, not the old denial',async()=>{
  const h=await harness();h.state.sync='PERMISSION_REQUIRED';assert.equal(await h.read(),'PENDING');assert.equal(h.state.collects,0);
});

test('failed consent status read never invents an ingestion or native collection failure',async()=>{
  const h=await harness();h.state.error=Error('NETWORK');
  assert.equal(await h.read(),'STATUS_UNAVAILABLE');assert.equal(h.state.permissionReads,1);assert.equal(h.state.collects,0);
});
