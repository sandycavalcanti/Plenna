import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const dataLocal = data => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
const instante = (dia, hora = 12, minuto = 0) => new Date(2026, 8, dia, hora, minuto).getTime();
const plain = value => JSON.parse(JSON.stringify(value));

async function preparar(agora = instante(13)) {
  const state = { agora, consultas: [], envios: [], uso: {}, effects: [], listeners: [], cooldown: null, cacheWrites: 0 };
  const sessionController = new AbortController();
  const session = {
  id: 1,
  signal: sessionController.signal,
  controller: sessionController,
  };
  const context = vm.createContext({
  __DEV__: false,
  AbortController,
  Date: class extends Date {
    constructor(...args) { super(...(args.length ? args : [state.agora])); }
    static now() { return state.agora; }
  } });
  const root = new URL('../', import.meta.url);
  const mocks = new Map([
    ['react', { useRef: current => ({ current }), useEffect: effect => state.effects.push(effect) }],
    ['react-native', { AppState: { currentState: 'active', addEventListener(name, fn) {
      state.listeners.push(fn); return { remove() {} };
    } } }],
    ['@react-native-async-storage/async-storage', { default: {
      async getItem() { return state.cooldown; },
      async setItem(key, value) { state.cooldown = value; state.cacheWrites++; },
    } }],
    ['src/api/tokenStorage.js', { tokenStorage: {
      async captureSession() { return session; },
      assertSession() {
        if (session.signal.aborted) throw Object.assign(new Error('Sessão invalidada'), { code: 'RF017_SESSION_INVALIDATED' });
      },
    } }],
    ['src/api/consentimento.js', {
  async listarConsentimentos() {
    return [{
      consentimento_tipo_codigo: 'MONITORAMENTO_TEMPO_USO',
      consentimento_status: true,
    }];
  },
  monitoramentoEmAlteracao: () => false,
  observarAlteracaoMonitoramento: () => () => {},
}],
    ['src/api/tempoUso.js', {
      async listarAplicativosTempoUso() { return { versao: 1, aplicativos: [{ packageId: 'com.shopee.br', nomeApp: 'Shopee' }] }; },
      async sincronizarTempoUso(payload) {
        state.envios.push(plain(payload));
        if (state.aoEnviar) state.aoEnviar();
        return { recebidos: payload.registros.length, persistidos: payload.registros.length };
      },
    }],
    ['modules/plenna-usage-stats.js', {
      async hasUsageAccess() { return true; },
      async getForegroundUsage(inicio, fim) {
        state.consultas.push({ inicio, fim });
        if (state.aoColetar) state.aoColetar(state.consultas.length, session);
        const duracao = state.uso[dataLocal(new Date(inicio))];
        return duracao ? [{ packageName: 'com.shopee.br', durationSeconds: duracao }] : [];
      },
    }],
  ].map(([id, mock]) => [id.includes('/') && !id.startsWith('@') ? new URL(id, root).href : id, mock]));
  const pending = new Map();
  function load(id) {
    if (!pending.has(id)) pending.set(id, build(id));
    return pending.get(id);
  }
  async function build(id) {
    const mock = mocks.get(id);
    const mod = mock ? new vm.SyntheticModule(Object.keys(mock), function () {
      for (const [key, value] of Object.entries(mock)) this.setExport(key, value);
    }, { context, identifier: id }) : new vm.SourceTextModule(await readFile(new URL(id), 'utf8'), { context, identifier: id });
    await mod.link((name, parent) => load(name.startsWith('.') ? new URL(name + '.js', parent.identifier).href : name));
    return mod;
  }
  const service = await load(new URL('src/services/tempoUsoSyncService.js', root).href);
  await service.evaluate();
  const utils = await load(new URL('src/utils/tempoUsoSync.js', root).href);
  return { state, sync: service.namespace.sincronizarTempoUsoDoDia, janelas: utils.namespace.obterJanelasRecuperacaoTempoUso,
    async mount() {
      const hook = await load(new URL('src/hooks/useTempoUsoSync.js', root).href);
      await hook.evaluate(); hook.namespace.useTempoUsoSync(); state.effects.pop()();
      await new Promise(setImmediate);
    },
    async reativar() {
      for (const fn of state.listeners) { fn('background'); fn('active'); }
      await new Promise(setImmediate);
    },
  };
}

test('recupera D0/D−1/D−2 com intervalos locais completos e snapshot atual até agora', async () => {
  const { state, sync } = await preparar();
  state.uso = { '2026-09-13': 30, '2026-09-12': 120, '2026-09-11': 240 };
  assert.equal((await sync()).quantidade, 3);
  assert.deepEqual(state.consultas, [
    { inicio: instante(13, 0), fim: instante(13) },
    { inicio: instante(12, 0), fim: instante(13, 0) },
    { inicio: instante(11, 0), fim: instante(12, 0) },
  ]);
  assert.equal(state.envios.length, 1);
  assert.equal(state.envios[0].schemaVersion, 1);
  assert.deepEqual(state.envios[0].registros.map(r => [r.dataLocal, r.duracaoSegundos]), [
    ['2026-09-13', 30], ['2026-09-12', 120], ['2026-09-11', 240],
  ]);
  for (const r of state.envios[0].registros) {
    assert.equal(new Date(r.inicio).getHours(), 0);
    assert.equal(new Date(r.fim).getHours(), 0);
    assert.equal(r.timezone, Intl.DateTimeFormat().resolvedOptions().timeZone);
    assert.equal(new Date(r.fim).getDate(), new Date(r.inicio).getDate() + 1);
  }
});

test('dia vazio é omitido sem impedir recuperação dos outros dias', async () => {
  const { state, sync } = await preparar();
  state.uso = { '2026-09-13': 30, '2026-09-11': 240 };
  await sync();
  assert.deepEqual(state.envios[0].registros.map(r => r.dataLocal), ['2026-09-13', '2026-09-11']);
});

test('três dias vazios não geram PUT', async () => {
  const { state, sync } = await preparar();
  assert.equal((await sync()).motivo, 'sem_registros');
  assert.equal(state.consultas.length, 3);
  assert.equal(state.envios.length, 0);
});

test('exatamente à meia-noite não consulta intervalo vazio de hoje e recupera dias passados', async () => {
  const { state, sync } = await preparar(instante(14, 0));
  state.uso = { '2026-09-13': 120, '2026-09-12': 240 };
  await sync();
  assert.equal(state.consultas.length, 2);
  assert.deepEqual(state.envios[0].registros.map(r => r.dataLocal), ['2026-09-13', '2026-09-12']);
});

test('coleta atravessando meia-noite descarta lote antigo e recompõe janela sem D−3', async () => {
  const { state, sync } = await preparar(instante(13, 23, 59));
  state.uso = { '2026-09-14': 10, '2026-09-13': 120, '2026-09-12': 240, '2026-09-11': 300 };
  state.aoColetar = n => { if (n === 1) state.agora = instante(14, 0, 1); };
  await sync();
  assert.equal(state.envios.length, 1);
  assert.deepEqual(state.envios[0].registros.map(r => r.dataLocal), ['2026-09-14', '2026-09-13', '2026-09-12']);
  assert.ok(state.consultas.some(r => r.inicio === instante(13, 0) && r.fim === instante(14, 0)));
  assert.equal(state.consultas.some(r => r.inicio === instante(11, 0)), false);
});

test('mudanças repetidas de data encerram tentativa limitada sem enviar', async () => {
  const { state, sync } = await preparar();
  state.aoColetar = () => { const d = new Date(state.agora); d.setDate(d.getDate() + 1); state.agora = d.getTime(); };
  assert.equal((await sync()).motivo, 'dia_alterado');
  assert.equal(state.consultas.length, 2);
  assert.equal(state.envios.length, 0);
});

test('reenvio recalcula duração absoluta mantendo chave diária, sem somar snapshots', async () => {
  const { state, sync } = await preparar();
  state.uso = { '2026-09-12': 120 };
  await sync();

state.agora += 15 * 60 * 1000;
state.uso['2026-09-12'] = 180;

await sync();
  const first = state.envios[0].registros[0], second = state.envios[1].registros[0];
  assert.deepEqual({ ...first, duracaoSegundos: 180 }, second);
});

test('cooldown do dia anterior não bloqueia recuperação no novo dia', async () => {
  const { state, mount } = await preparar(instante(14, 0, 1));
  state.cooldown = String(instante(13, 23, 59));
  state.uso = { '2026-09-13': 120 };
  await mount();
  assert.equal(state.envios.length, 1);
});

test('cooldown do mesmo dia bloqueia temporariamente e retorno após 15 minutos recupera ontem', async () => {
  const { state, sync } = await preparar();

  state.uso = { '2026-09-12': 120 };

  await sync();
  assert.equal(state.envios.length, 1);

  const bloqueado = await sync();
  assert.equal(bloqueado.motivo, 'cooldown_ativo');
  assert.equal(state.envios.length, 1);

  state.agora += 15 * 60 * 1000;

  await sync();

  assert.equal(state.envios.length, 2);
  assert.equal(state.envios[1].registros[0].dataLocal, '2026-09-12');
});

test('PUT concluído depois da meia-noite não grava cooldown para a janela antiga', async () => {
  const { state, mount, reativar } = await preparar(instante(13, 23, 59));
  state.uso = { '2026-09-13': 120 };
  state.aoEnviar = () => { state.agora = instante(14, 0, 1); };
  await mount();
  assert.equal(state.envios.length, 1);
  assert.equal(state.cacheWrites, 0);
  delete state.aoEnviar;
  state.agora += 15 * 60 * 1000;
  await reativar();
  assert.equal(state.envios.length, 2);
  assert.equal(new Date(state.envios[1].registros[0].fim).getTime(), instante(14, 0));
});

test('sessão invalidada durante recuperação de ontem impede coleta de D−2 e PUT', async () => {
  const { state, sync } = await preparar();
  state.uso = { '2026-09-13': 30, '2026-09-12': 120 };
 state.aoColetar = (n, session) => {
  if (n === 2) session.controller.abort();
};
  assert.equal((await sync()).motivo, 'sessao_invalidada');
  assert.equal(state.consultas.length, 2);
  assert.equal(state.envios.length, 0);
});

test('dias locais atravessam mês/ano sem subtrair milissegundos fixos', async () => {
  const { janelas } = await preparar();
  assert.deepEqual(plain(janelas(new Date(2026, 0, 1, 12))).map(j => j.dataLocal), ['2026-01-01', '2025-12-31', '2025-12-30']);
});

test('dias de 23/25 horas preservam meias-noites e offsets locais', async () => {
  const { janelas } = await preparar();
  const anterior = process.env.TZ;
  try {
    process.env.TZ = 'America/New_York';
    for (const [mes, dia, horas, offsetInicio, offsetFim] of [
      [2, 9, 23, 300, 240], [10, 2, 25, 240, 300],
    ]) {
      const ontem = janelas(new Date(2026, mes, dia, 12))[1];
      assert.equal((ontem.fim.getTime() - ontem.inicio.getTime()) / 3600000, horas);
      assert.equal(ontem.inicio.getHours(), 0);
      assert.equal(ontem.fim.getHours(), 0);
      assert.equal(ontem.inicio.getTimezoneOffset(), offsetInicio);
      assert.equal(ontem.fim.getTimezoneOffset(), offsetFim);
      assert.equal(ontem.fimColeta.getTime(), ontem.fim.getTime());
      assert.equal(ontem.timezone, 'America/New_York');
    }
  } finally {
    if (anterior === undefined) delete process.env.TZ;
    else process.env.TZ = anterior;
  }
});
