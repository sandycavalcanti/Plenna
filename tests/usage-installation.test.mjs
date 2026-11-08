import assert from 'node:assert/strict';
import test from 'node:test';
import {installationCredential} from '../src/utils/usageInstallation.js';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
test('Monitoramento de tempo em aplicativos restored SecureStore credential rotates when private installation anchor changes',async()=>{
  const previous={id:id(1),secret:'a'.repeat(64),anchor:id(2)};
  const next=await installationCredential(previous,id(3),async()=>({id:id(4),secret:'b'.repeat(64)}));
  assert.equal(next.created,true);assert.equal(next.value.needsNewEpisode,true);assert.notEqual(next.value.id,previous.id);assert.notEqual(next.value.secret,previous.secret);assert.equal(previous.anchor,id(2));
});
test('Monitoramento de tempo em aplicativos stable installation reuses credential without new entropy or permanent device identifiers',async()=>{
  const previous={id:id(1),secret:'a'.repeat(64),anchor:id(2)};const next=await installationCredential(previous,id(2),()=>{throw Error('MUST_NOT_ROTATE');});assert.equal(next.value,previous);assert.equal(next.created,false);
});
test('Monitoramento de tempo em aplicativos invalid anchor or entropy prevents installation association',async()=>{
  await assert.rejects(installationCredential(null,'invalid',async()=>({id:id(1),secret:'a'.repeat(64)})),/ANCHOR_INVALID/);
  await assert.rejects(installationCredential(null,id(2),async()=>({id:id(1),secret:id(3)})),/ENTROPY_INVALID/);
});
