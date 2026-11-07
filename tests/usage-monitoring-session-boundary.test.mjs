import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/api/tokenStorage.js',import.meta.url),'utf8');
async function load({development=true,hookFailure=false,initial=[],storageFailure=false}={}){
  const values=new Map(initial),batches=[];let hookCalls=0;
  const context=vm.createContext({AbortController,Date,Math,__DEV__:development,process:{env:{EXPO_PUBLIC_USAGE_MONITORING_ENABLED:'true'}}});
  const storage={getItem:async k=>values.get(k)??null,setItem:async(k,v)=>values.set(k,v),removeItem:async k=>values.delete(k),multiSet:async batch=>{batches.push(batch);for(const[k,v]of batch)values.set(k,v);}};
  let fail = storageFailure;
  for (const method of ['setItem','removeItem','multiSet']) {
    const persist = storage[method];
    storage[method] = async (...args) => { if (fail) throw Error('DISK_FAILURE'); return persist(...args); };
  }
  const synthetic=async exports=>{const m=new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v);},{context});await m.link(()=>{throw Error('NO_DEPENDENCIES');});await m.evaluate();return m;};
  const m=new vm.SourceTextModule(source,{context,importModuleDynamically:()=>synthetic({stopUsageMonitoringForLogout:async()=>{hookCalls++;if(hookFailure)throw Error('SECURE_STORE_FAILURE');}})});
  await m.link(name=>name.includes('async-storage')?synthetic({default:storage}):synthetic({localValidation:{enabled:false}}));await m.evaluate();
  return {token:m.namespace.tokenStorage,values,batches,hookCalls:()=>hookCalls,recoverStorage:()=>{fail=false;}};
}

for (const development of [true,false]) test(`logout reports storage failure and permits retry (development=${development})`,async()=>{
  const h=await load({development,storageFailure:true,initial:[['@plenna:authToken','A']]});
  const session=await h.token.captureSession();
  await assert.rejects(h.token.clearToken(),{code:'AUTH_STORAGE_FAILURE'});
  assert.equal(session.signal.aborted,true);
  assert.equal(await h.token.captureSession(),null);
  assert.equal(h.values.get('@plenna:authToken'),'A');
  h.recoverStorage();await h.token.clearToken();
  assert.ok(!h.values.get('@plenna:authToken'));
});
test('Monitoramento de tempo em aplicativos token and episode boundary commit atomically; logout invalidates work immediately',async()=>{
  const h=await load();await h.token.setToken('A');const session=await h.token.captureSession(),first=h.token.getUsageBoundary();
  assert.equal(h.batches.length,1);assert.equal(h.values.get('@plenna:authToken'),'A');assert.equal(h.values.get('@plenna:rf017SessionBoundary'),first);
  const logout=h.token.clearToken();assert.equal(session.signal.aborted,true);await logout;
  assert.equal(await h.token.captureSession(),null);assert.notEqual(h.token.getUsageBoundary(),first);assert.equal(h.values.get('@plenna:authToken'),'');
});
test('Monitoramento de tempo em aplicativos SecureStore boundary failure cannot block token removal or reuse the old boundary',async()=>{
  const h=await load({hookFailure:true});await h.token.setToken('A');const first=h.token.getUsageBoundary();await h.token.clearToken();assert.notEqual(first,h.token.getUsageBoundary());assert.equal(h.values.get('@plenna:authToken'),'');assert.equal(h.values.get('@plenna:rf017SessionBoundary'),h.token.getUsageBoundary());
});
test('Monitoramento de tempo em aplicativos boundary survives process restart; production token storage stays compatible',async()=>{
  const h=await load({initial:[['@plenna:authToken','A'],['@plenna:rf017SessionBoundary','persisted-boundary']]});assert.equal(await h.token.getToken(),'A');assert.equal(h.token.getUsageBoundary(),'persisted-boundary');
  const production=await load({development:false});await production.token.setToken('A');assert.equal(production.batches.length,1);assert.equal(production.hookCalls(),1);assert.equal(production.values.get('@plenna:authToken'),'A');
});
