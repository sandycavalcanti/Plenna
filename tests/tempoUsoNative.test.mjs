import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from '@babel/core';

// Executa a interface real, substituindo apenas Expo/RN. Não carrega Kotlin.
const path = new URL('../modules/plenna-usage-stats/src/PlennaUsageStatsModule.ts', import.meta.url);
const source = transformSync(await readFile(path, 'utf8'), {
  filename: path.pathname, configFile: false, babelrc: false,
  plugins: ['@babel/plugin-transform-typescript'],
}).code;

async function carregar(platform, resolver, localValidationEnabled = false, development = false, diagnosticOptIn) {
  const context = vm.createContext({__DEV__:development,process:{env:{EXPO_PUBLIC_USAGE_NATIVE_DIAGNOSTIC:diagnosticOptIn}}});
  const expo = new vm.SyntheticModule(['requireOptionalNativeModule'], function () {
    this.setExport('requireOptionalNativeModule', resolver);
  }, { context });
  const rn = new vm.SyntheticModule(['Platform'], function () {
    this.setExport('Platform', { OS: platform });
  }, { context });
  const mod = new vm.SourceTextModule(source, { context });
  await mod.link(name => {
    if (name.endsWith('/api/localValidationPolicy')) return new vm.SyntheticModule(['localValidation'], function () {
      this.setExport('localValidation', { enabled: localValidationEnabled });
    }, { context });
    if (name === 'expo-modules-core') return expo;
    if (name === 'react-native') return rn;
    throw new Error('Import inesperado: ' + name);
  });
  await mod.evaluate();
  return mod.namespace;
}

test('validação local bloqueia todas as entradas de uso sem resolver o nativo', async () => {
  const mod = await carregar('android', () => { throw Error('Nativo não autorizado'); }, true);
  assert.equal((await mod.getModuleStatus()).available, false);
  assert.equal(await mod.hasUsageAccess(), false);
  assert.equal(await mod.openUsageAccessSettings(), false);
  assert.equal((await mod.getUsageEvents(0, 1)).length, 0);
  assert.equal((await mod.getForegroundUsage(0, 1)).length, 0);
});
function moduloNativoSimulado(getModuleStatus) {
  return {
    getModuleStatus,
    hasUsageAccess: async () => true,
    openUsageAccessSettings: async () => {},
    getUsageEvents: async () => [],
    getForegroundUsage: async () => [],
  };
}

test('import não consulta módulo; diagnóstico Android chama o nativo sob demanda', async () => {
  let chamadas = 0;
  const mod = await carregar('android', name => {
    chamadas++;
    assert.equal(name, 'PlennaUsageStats');
    return moduloNativoSimulado(async () => ({
  available: true,
  platform: 'android',
  module: 'plenna-usage-stats',
}));
  });
  assert.equal(chamadas, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(await mod.getModuleStatus())), {
    available: true, platform: 'android', module: 'plenna-usage-stats',
  });
  assert.equal(chamadas, 1);
});

for (const platform of ['ios', 'web']) test(platform + ' retorna resultado controlado sem resolver nativo', async () => {
  const mod = await carregar(platform, () => { throw new Error('Não deve chamar'); });
  assert.equal((await mod.getModuleStatus()).reason, 'unsupported_platform');
});

test('Android sem módulo retorna indisponibilidade', async () => {
  const mod = await carregar('android', () => null);
  assert.equal((await mod.getModuleStatus()).reason, 'native_module_unavailable');
});

for (const [nome, resolver] of [
  ['resolução falha', () => { throw new Error('Falha'); }],
 ['diagnóstico falha', () => moduloNativoSimulado(async () => {
  throw new Error('Falha');
})],
['resposta inválida', () => moduloNativoSimulado(async () => ({
  available: true,
}))],
]) test(nome + ' não propaga exceção', async () => {
  const mod = await carregar('android', resolver);
  const status = await mod.getModuleStatus();
  assert.equal(status.available, false);
  assert.equal(status.reason, 'native_diagnostic_failed');
});
