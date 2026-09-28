import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const catalogo = () => ({ versao: 1, aplicativos: [
  { packageId: 'com.shopee.br', nomeApp: 'Shopee' },
  { packageId: 'com.mercadolibre', nomeApp: 'Mercado Livre' },
  { packageId: 'com.zzkko', nomeApp: 'SHEIN' },
] });
const amazon = { packageName: 'com.amazon.mShop.android.shopping', durationSeconds: 120 };
const TTL = 60 * 60 * 1000;
const plain = value => JSON.parse(JSON.stringify(value));

// Executa serviço, cache, filtro e payload reais. Substitui somente rede, Android e relógio.
async function preparar() {
  const estado = {
    agora: Date.parse('2026-09-13T15:00:00Z'),
    consentimento: true, usageAccess: true, catalogo: catalogo(),
    uso: [...catalogo().aplicativos.map((app, i) => ({
      packageName: app.packageId, durationSeconds: (i + 1) * 60,
    })), amazon],
    chamadas: [], envios: [], consultas: 0,
  };
 const context = vm.createContext({
  AbortController,
  Date: class extends Date {
    constructor(...args) {
      super(...(args.length ? args : [estado.agora]));
    }
    static now() {
      return estado.agora;
    }
  },
});
  const root = new URL('../', import.meta.url);
  const mocks = new Map([
    [new URL('src/api/tokenStorage.js', root).href, { tokenStorage: {
     captureSession: async () => ({
  id: 1,
  signal: new AbortController().signal,
}),
      assertSession() {},
    } }],
    [new URL('src/api/tempoUso.js', root).href, {
      listarAplicativosTempoUso: async () => {
        estado.chamadas.push('catalogo');
        estado.consultas++;
        if (estado.esperarCatalogo) await estado.esperarCatalogo;
        if (estado.erroCatalogo) throw estado.erroCatalogo;
        return estado.catalogo;
      },
      sincronizarTempoUso: async payload => {
        estado.chamadas.push('sync');
        estado.envios.push(plain(payload));
        if (estado.erroSync) throw estado.erroSync;
        return { recebidos: payload.registros.length, persistidos: payload.registros.length };
      },
    }],
   [new URL('src/api/consentimento.js', root).href, {
  listarConsentimentos: async () => {
    estado.chamadas.push('consentimento');
    return [{
      consentimento_tipo_codigo: 'MONITORAMENTO_TEMPO_USO',
      consentimento_status: estado.consentimento,
    }];
  },
  monitoramentoEmAlteracao: () => false,
  observarAlteracaoMonitoramento: () => () => {},
}],
    [new URL('modules/plenna-usage-stats.js', root).href, {
      hasUsageAccess: async () => { estado.chamadas.push('usageAccess'); return estado.usageAccess; },
      getForegroundUsage: async (inicio) => {
        estado.chamadas.push('coleta');
        return new Date(inicio).getDate() === new Date(estado.agora).getDate() ? estado.uso : [];
      },
    }],
  ]);
  const modules = new Map();
  async function carregar(url) {
    if (modules.has(url.href)) return modules.get(url.href);
    const mock = mocks.get(url.href);
    const mod = mock
      ? new vm.SyntheticModule(Object.keys(mock), function () {
        for (const [key, value] of Object.entries(mock)) this.setExport(key, value);
      }, { context, identifier: url.href })
      : new vm.SourceTextModule(await readFile(url, 'utf8'), { context, identifier: url.href });
    modules.set(url.href, mod);
    await mod.link((specifier, parent) => carregar(new URL(specifier + '.js', parent.identifier)));
    return mod;
  }
  const servico = await carregar(new URL('src/services/tempoUsoSyncService.js', root));
  await servico.evaluate();
  return {
    estado,
    sync: servico.namespace.sincronizarTempoUsoDoDia,
    obter: modules.get(new URL('src/services/aplicativosCompraService.js', root).href).namespace.obterAplicativosCompra,
    payload: modules.get(new URL('src/utils/tempoUsoSync.js', root).href).namespace.montarPayloadTempoUsoDiario,
  };
}

test('lote misto exclui Amazon e desconhecidos; preserva os três apps e o payload diário', async () => {
  const { estado, sync } = await preparar();
  estado.uso.push({ packageName: 'com.exemplo.loja', durationSeconds: 60 });
  const resultado = await sync();
  assert.equal(estado.chamadas.filter(item => item === 'catalogo').length, 1);
assert.equal(estado.chamadas.filter(item => item === 'coleta').length, 3);
assert.equal(estado.chamadas.filter(item => item === 'sync').length, 1);
assert.ok(estado.chamadas.filter(item => item === 'consentimento').length >= 1);
assert.ok(estado.chamadas.filter(item => item === 'usageAccess').length >= 1);
  assert.equal(resultado.quantidade, 3);
  assert.equal(estado.envios[0].schemaVersion, 1);
  assert.deepEqual(estado.envios[0].registros.map(r => r.packageId), catalogo().aplicativos.map(a => a.packageId));
  assert.deepEqual(estado.envios[0].registros.map(r => r.duracaoSegundos), [60, 120, 180]);
  for (const registro of estado.envios[0].registros) {
    assert.deepEqual(Object.keys(registro).sort(), ['dataLocal', 'duracaoSegundos', 'fim', 'inicio', 'packageId', 'timezone']);
    assert.match(registro.dataLocal, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(registro.timezone);
    assert.equal(new Date(registro.inicio).getHours(), 0);
    assert.equal(new Date(registro.fim).getDate(), new Date(registro.inicio).getDate() + 1);
  }
});

test('catálogo é reutilizado e renova no vencimento; app novo só depende da resposta da API', async () => {
  const { estado, sync } = await preparar();
  // Identidade fictícia exclusivamente de teste, não uma aprovação de app real.
  const novo = { packageId: 'com.exemplo.loja', nomeApp: 'Loja de teste' };
  estado.uso.push({ packageName: novo.packageId, durationSeconds: 42 });
  await sync();
  estado.catalogo = { versao: 1, aplicativos: [...catalogo().aplicativos, novo] };
  estado.agora += TTL - 1;
  await sync();
  assert.equal(estado.consultas, 1);
  assert.equal(estado.envios[1].registros.length, 3);
  estado.agora += 15 * 60 * 1000;
  await sync();
  assert.equal(estado.consultas, 2);
  assert.equal(estado.envios[2].registros.at(-1).packageId, novo.packageId);
  assert.equal(estado.envios[2].registros.at(-1).duracaoSegundos, 42);
});

test('consultas simultâneas compartilham uma requisição de catálogo', async () => {
  const { estado, obter } = await preparar();
  let liberar;
  estado.esperarCatalogo = new Promise(resolve => { liberar = resolve; });
  const primeira = obter();
  const segunda = obter();
  assert.equal(estado.consultas, 1);
  liberar();
  assert.equal(await primeira, await segunda);
});

test('offline sem cache não coleta nem envia e permite tentar novamente', async () => {
  const { estado, sync } = await preparar();
  estado.erroCatalogo = new Error('offline');
  await assert.rejects(sync(), /offline/);
  assert.deepEqual(estado.chamadas, ['consentimento', 'usageAccess', 'catalogo']);
  assert.equal(estado.envios.length, 0);
  estado.erroCatalogo = null;
  await sync();
  assert.equal(estado.consultas, 2);
  assert.equal(estado.envios.length, 1);
});

test('cache válido dispensa rede do catálogo; cache vencido não serve de fallback', async () => {
  const { estado, obter } = await preparar();
  await obter();
  estado.erroCatalogo = new Error('offline');
  assert.equal((await obter()).length, 3);
  assert.equal(estado.consultas, 1);
  estado.agora += TTL;
  await assert.rejects(obter(), /offline/);
  assert.equal(estado.consultas, 2);
});

test('relógio anterior à obtenção do cache exige nova consulta', async () => {
  const { estado, obter } = await preparar();
  await obter();
  estado.agora--;
  await obter();
  assert.equal(estado.consultas, 2);
});

for (const resposta of [null, {}, { versao: 2, aplicativos: [] }, { versao: 1, aplicativos: null },
  { versao: 1, aplicativos: [null] },
  { versao: 1, aplicativos: [{ packageId: 'inválido', nomeApp: 'Loja' }] },
  { versao: 1, aplicativos: [{ packageId: 'com.exemplo.loja', nome: 'Campo antigo' }] },
  { versao: 1, aplicativos: [catalogo().aplicativos[0], catalogo().aplicativos[0]] },
]) test('contrato inválido bloqueia coleta e envio: ' + JSON.stringify(resposta), async () => {
  const { estado, sync } = await preparar();
  estado.catalogo = resposta;
  await assert.rejects(sync(), /Catálogo.*inválido/);
  assert.equal(estado.chamadas.includes('coleta'), false);
  assert.equal(estado.envios.length, 0);
});

test('catálogo vazio é válido e não gera envio', async () => {
  const { estado, sync } = await preparar();
  estado.catalogo = { versao: 1, aplicativos: [] };
  assert.equal((await sync()).motivo, 'sem_registros');
  assert.equal(estado.envios.length, 0);
  await sync();
  assert.equal(estado.consultas, 1);
});

test('sem catálogo explícito o payload não autoriza nenhum package', async () => {
  const { payload } = await preparar();
  assert.equal(payload([amazon]).registros.length, 0);
});

for (const bloqueio of ['consentimento', 'usageAccess']) test(bloqueio + ' continua impedindo catálogo/coleta/envio', async () => {
  const { estado, sync } = await preparar();
  estado[bloqueio] = false;
  assert.equal((await sync()).sincronizado, false);
  assert.equal(estado.consultas, 0);
  assert.equal(estado.chamadas.includes('coleta'), false);
  assert.equal(estado.envios.length, 0);
});

test('422 invalida cache; próxima tentativa retira app removido sem reenviar automaticamente', async () => {
  const { estado, sync } = await preparar();
 await sync();
estado.agora += 15 * 60 * 1000;
estado.erroSync = { response: { status: 422 } };
  await assert.rejects(sync());
  assert.equal(estado.envios.length, 2);
  estado.erroSync = null;
  estado.catalogo = { versao: 1, aplicativos: [catalogo().aplicativos[0]] };
  await sync();
  assert.equal(estado.consultas, 2);
  assert.equal(estado.envios[2].registros.length, 1);
});

test('falha de rede no sync não invalida catálogo válido', async () => {
  const { estado, sync } = await preparar();
  estado.erroSync = new Error('offline');
  await assert.rejects(sync(), /offline/);
  estado.erroSync = null;
  await sync();
  assert.equal(estado.consultas, 1);
});
