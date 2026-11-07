import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

async function policy(env){
 const context=vm.createContext({__DEV__:true,process:{env}});
 const m=new vm.SourceTextModule(fs.readFileSync('src/api/usageMonitoringPolicy.js','utf8'),{context});
 await m.link(()=>{throw Error('POLICY_MUST_NOT_HAVE_RUNTIME_DEPENDENCIES');});await m.evaluate();
 return [m.namespace.usageMonitoringEnabled,m.namespace.usageMonitoringReadsEnabled];
}
test('novas flags Mobile são explícitas; variáveis anteriores não habilitam por ausência',async()=>{
 assert.deepEqual(await policy({}),[false,false]);
 assert.deepEqual(await policy({EXPO_PUBLIC_RF017_V2_HOMOLOGATION:'1',EXPO_PUBLIC_RF017_V2_READS:'1'}),[false,false]);
 assert.deepEqual(await policy({EXPO_PUBLIC_USAGE_MONITORING_ENABLED:'true',EXPO_PUBLIC_USAGE_MONITORING_READS_ENABLED:'true'}),[true,true]);
 assert.deepEqual(await policy({EXPO_PUBLIC_USAGE_MONITORING_ENABLED:'false',EXPO_PUBLIC_USAGE_MONITORING_READS_ENABLED:'1'}),[false,false]);
});
test('renomear módulos não altera chaves persistidas, âncora ou header instalado',()=>{
 const service=fs.readFileSync('src/services/usageMonitoringService.js','utf8');
 const storage=fs.readFileSync('src/api/tokenStorage.js','utf8');
 const native=fs.readFileSync('modules/plenna-usage-stats/android/src/main/java/expo/modules/plennausagestats/PlennaUsageStatsModule.kt','utf8');
 assert.ok(service.includes('plenna.rf017.installation.v2'));assert.ok(service.includes('x-rf017-installation-key'));
 assert.ok(storage.includes('@plenna:rf017SessionBoundary'));assert.ok(native.includes('rf017-installation-anchor'));
});
