import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  etapasContexto,
  resumoDeclarado,
  criarRascunhos,
} from '../src/components/PurchaseComponents/ContextoCompra/fluxo.js';
import {
  diaCivil,
  periodoCivil,
  coberturaRespostas,
} from '../src/components/PurchaseComponents/HistoricoConsumo/apresentacao.js';
const campos = [
  'planejamento',
  'influenciaPromocional',
  'necessidadeInesperada',
  'momento',
  'autopercepcaoImpulsividade',
];
const data = (respostas = {}, itens = []) => ({
  contexto: { respostas, itens },
  perguntas: {
    perguntas: campos
      .filter(
        (c) =>
          respostas[c] === undefined &&
          (c !== 'momento' ||
            ['SIM', 'PARCIALMENTE'].includes(respostas.planejamento) ||
            respostas.influenciaPromocional === 'SIM'),
      )
      .map((codigo) => ({ codigo })),
    catalogo: campos.map((campo) => ({ campo, codigo: campo, opcoes: [] })),
    itens: [{ itemId: 10, nome: 'Livro' }],
    planejamentoItemOpcoes: [],
  },
});
test('adaptive forecast mirrors existing declared planning and promotion conditions without money or classifications', () => {
  for (const planejamento of [
    undefined,
    'SIM',
    'PARCIALMENTE',
    'NAO',
    'NAO_LEMBRO',
    'PREFIRO_NAO_RESPONDER',
  ])
    for (const influenciaPromocional of [
      undefined,
      'SIM',
      'NAO',
      'PREFIRO_NAO_RESPONDER',
    ]) {
      const list = etapasContexto(data(), {
        planejamento,
        influenciaPromocional,
      });
      assert.equal(
        list.some((q) => q.campo === 'momento'),
        ['SIM', 'PARCIALMENTE'].includes(planejamento) ||
          influenciaPromocional === 'SIM',
      );
      assert.equal(
        list.some((q) => q.itemId === 10),
        planejamento === 'PARCIALMENTE',
      );
    }
});
test('known answers including refusals are not invitations; removal and voluntary review remain possible', () => {
  const d = data({
    planejamento: 'PREFIRO_NAO_RESPONDER',
    influenciaPromocional: 'NAO',
    necessidadeInesperada: 'SIM',
    autopercepcaoImpulsividade: 'NAO',
  });
  assert.deepEqual(etapasContexto(d), []);
  assert.equal(
    etapasContexto(d, { planejamento: null })[0].campo,
    'planejamento',
  );
  assert.equal(etapasContexto(d, {}, {}, true).length, 6);
  assert.equal(
    etapasContexto(
      data({ planejamento: 'PARCIALMENTE' }, [
        { itemId: 10, planejamento: 'SIM' },
      ]),
    ).some((q) => q.itemId === 10),
    false,
  );
});
test('empty authoritative API invitations do not produce artificial questions from catalogue', () => {
  const d = data();
  d.perguntas.perguntas = [];
  assert.deepEqual(etapasContexto(d), []);
});
test('summary never turns missing refusal or self-perception into an automatic classification', () => {
  assert.equal(resumoDeclarado({})[0].valor, 'Não informado');
  assert.equal(
    resumoDeclarado({ planejamento: 'PREFIRO_NAO_RESPONDER' })[0].valor,
    'Prefiro não responder',
  );
  assert.equal(
    resumoDeclarado({ autopercepcaoImpulsividade: 'NAO' })[2].valor,
    'Não percebi impulso',
  );
  assert.equal(
    resumoDeclarado({ planejamento: 'SIM', influenciaPromocional: 'SIM' })[1]
      .valor,
    'Influenciou',
  );
});
test('drafts are isolated by session, purchase and revision and erased on logout', () => {
  const store = criarRascunhos(),
    a = new AbortController(),
    b = new AbortController(),
    s = { id: 1, signal: a.signal },
    other = { id: 2, signal: b.signal };
  store.salvar(s, 10, { revisao: 3, respostas: { planejamento: 'SIM' } });
  assert.equal(store.ler(s, 10, 3).respostas.planejamento, 'SIM');
  assert.equal(store.ler(s, 11, 3), null);
  assert.equal(store.ler(s, 10, 4), null);
  assert.equal(store.ler(other, 10, 3), null);
  a.abort();
  assert.equal(store.ler(s, 10, 3), null);
});
test('draft from another controller cannot survive a reused session ID', () => {
  const store = criarRascunhos(),
    a = { id: 1, signal: new AbortController().signal },
    b = { id: 1, signal: new AbortController().signal };
  store.salvar(a, 10, { revisao: 1 });
  assert.equal(store.ler(b, 10, 1), null);
});
test('civil periods are natural inclusive dates, including leap day and empty window', () => {
  assert.equal(diaCivil('2026-10-01T00:00:00Z'), '1º de outubro de 2026');
  assert.equal(
    periodoCivil('2026-10-01T00:00:00Z', '2026-10-25T00:00:00Z'),
    '1º a 24 de outubro de 2026',
  );
  assert.equal(
    periodoCivil('2024-02-01T00:00:00Z', '2024-03-01T00:00:00Z'),
    '1º a 29 de fevereiro de 2024',
  );
  assert.equal(
    periodoCivil('2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z'),
    'Sem dias observados neste período',
  );
});
test('civil dates never change on devices in western or eastern timezones', () => {
  for (const TZ of [
    'America/Sao_Paulo',
    'Pacific/Honolulu',
    'Pacific/Kiritimati',
  ]) {
    const script =
      "import{periodoCivil}from'./src/components/PurchaseComponents/HistoricoConsumo/apresentacao.js';process.stdout.write(periodoCivil('2026-10-01T00:00:00Z','2026-10-25T00:00:00Z'))";
    assert.equal(
      execFileSync(process.execPath, ['--input-type=module', '-e', script], {
        env: { ...process.env, TZ },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
      '1º a 24 de outubro de 2026',
    );
  }
});
test('known answer coverage retains unknown/refused cases in the universe only', () => {
  assert.equal(
    coberturaRespostas(
      { universo: 3, conhecidas: 1 },
      { universo: 2, conhecidas: 1 },
    ),
    '2 de 5 (40%)',
  );
  assert.equal(
    coberturaRespostas(
      { universo: 0, conhecidas: 0 },
      { universo: 0, conhecidas: 0 },
    ),
    '0 de 0 (0%)',
  );
});
