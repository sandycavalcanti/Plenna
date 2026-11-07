import test from 'node:test';
import assert from 'node:assert/strict';
import { accessEntry, accessMetrics, accessQuality } from '../src/utils/usageAccessQuality.js';
test('interval starts, lock resumptions and independent entries remain distinct in Mobile metrics',()=>{
 assert.deepEqual(accessMetrics([{quality:1027},{quality:515},{quality:259},{quality:24}]),{observedIntervals:4,identifiedOpenings:1,identifiedResumptions:1,unknownEntries:1});
 assert.equal(accessEntry(67,3),'unknown');assert.equal(accessEntry(259,3),'unknown');assert.equal(accessEntry(24,4),'continuation');
 assert.match(accessQuality(1|2|512,4),/retomada/);assert.doesNotMatch(accessQuality(1|2|512,4),/independente/);
 assert.match(accessQuality(8192,4,'source'),/fonte/);assert.doesNotMatch(accessQuality(8192,4,'source'),/continuidade|incompleto/);
});
