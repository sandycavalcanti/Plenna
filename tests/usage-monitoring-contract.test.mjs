import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

test('Monitoramento de tempo em aplicativos Mobile/API contracts are identical and have no runtime dependencies', async () => {
  const mobile = await readFile(new URL('../src/contracts/usage-monitoring.ts', import.meta.url), 'utf8');
  const api = await readFile(process.env.PLENNA_API_ROOT ? `${process.env.PLENNA_API_ROOT}/src/modules/tempo-uso-v2/contracts.ts` : new URL('../../../API/Plenna-API/src/modules/tempo-uso-v2/contracts.ts', import.meta.url), 'utf8');
  assert.equal(mobile.replaceAll('\r\n', '\n'), api.replaceAll('\r\n', '\n'));
  const output = ts.transpileModule(mobile, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, removeComments: true } }).outputText;
  assert.equal(output.trim(), 'export const USAGE_MONITORING_VERSION = 2;');
});

test('Monitoramento de tempo em aplicativos hooks authenticated lifecycle while contracts remain free of side effects', async () => {
  const routes = await readFile(new URL('../src/routes.js', import.meta.url), 'utf8');
  assert.match(routes, /function TabRoutes\(\)\s*\{\s*useTempoUsoSync\(\)/);
  const contract = await readFile(new URL('../src/contracts/usage-monitoring.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(contract, /fetch\s*\(|axios|AsyncStorage|SecureStore|requireOptionalNativeModule/);
});
