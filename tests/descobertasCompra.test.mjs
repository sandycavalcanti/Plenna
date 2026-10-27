import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer } from './helpers/componentRenderer.mjs';
import { validarHistoricoCompra } from '../src/services/historicoCompraService.js';
const fixture = JSON.parse(
  readFileSync(
    new URL('./fixtures/historicoCompra.json', import.meta.url),
    'utf8',
  ),
);
const automaticFixture = JSON.parse(
  readFileSync(
    new URL('./fixtures/historicoCompraAutomatico.json', import.meta.url),
    'utf8',
  ),
);
const response = () => ({
  ...structuredClone(fixture),
  descobertas: {
    versao: 'automaticas-1',
    itens: [
      {
        codigo: 'VALOR_COMPARADO',
        natureza: 'REGISTRADO',
        titulo: 'R$ 100,00',
        detalhe: 'Mediana de 2 registros: R$ 80,00.',
        referencias: ['compra:1'],
        grafico: {
          unidade: 'CENTAVOS',
          pontos: [
            { rotulo: 'Esta compra', valor: 10000 },
            { rotulo: 'Mediana anterior', valor: 8000 },
          ],
        },
      },
      {
        codigo: 'RECORRENCIA_VINCULADA',
        natureza: 'REGISTRADO',
        titulo: 'Vinculada a uma recorrência',
        detalhe: '2 compras anteriores com o mesmo vínculo.',
        referencias: ['compra:1'],
      },
    ],
    reflexao: null,
    perguntasSugeridas: ['planejamento'],
    eventosPosteriores: [],
    limitacoes: [],
  },
});
const text = (n) =>
  n == null
    ? ''
    : typeof n === 'object'
      ? (n.props?.children ?? []).map(text).join('')
      : String(n);
function screen(data = response()) {
  let next = data,
    listener,
    asked;
  const abort = new AbortController();
  const client = { get: async () => ({ data: next }) };
  const native = Object.fromEntries(
    ['View', 'Text', 'Pressable', 'ActivityIndicator'].map((k) => [k, k]),
  );
  native.StyleSheet = { create: (v) => v };
  native.AppState = {
    addEventListener: (_, fn) => {
      listener = fn;
      return {
        remove() {
          listener = null;
        },
      };
    },
  };
  const renderer = createRenderer({
    'react-native': native,
    '../../../api/client': { apiClient: client },
    '../../../api/tokenStorage': {
      tokenStorage: {
        captureSession: async () => ({ id: 1, signal: abort.signal }),
        assertSession: () => {
          if (abort.signal.aborted) throw Error('SESSION_REQUIRED');
        },
      },
    },
  });
  renderer.mount(
    renderer.load(
      'src/components/PurchaseComponents/DescobertasCompra/index.js',
    ).default,
    {
      compraId: 1,
      revisao: 1,
      onResponder: (codes) => {
        asked = codes;
      },
    },
  );
  return {
    renderer,
    client,
    abort,
    background: () => listener('background'),
    set: (d) => {
      next = d;
    },
    asked: () => asked,
    content: () =>
      renderer
        .nodes((n) => n.type === 'Text')
        .map(text)
        .join('\n'),
    press: (label) => {
      const node = renderer.nodes(
        (n) => n.type === 'Pressable' && text(n) === label,
      )[0];
      assert.ok(node, label);
      node.props.onPress();
    },
  };
}
test('findings select one fact at a time, show a meaningful comparison on demand and keep questions voluntary', async () => {
  const h = screen();
  await h.renderer.flush();
  assert.ok(h.content().includes('R$ 100,00'));
  assert.ok(!h.content().includes('Vinculada a uma recorrência'));
  h.press('Comparar valores e registros');
  await h.renderer.flush();
  assert.ok(h.content().includes('Mediana anterior'));
  h.press('Recorrência');
  await h.renderer.flush();
  assert.ok(h.content().includes('Vinculada a uma recorrência'));
  assert.ok(!h.content().includes('R$ 100,00'));
  h.press('Complementar esta compra · opcional');
  assert.deepEqual(h.asked(), ['planejamento']);
  h.renderer.unmount();
});
test('pure API-generated automatic and temporal contracts render without contextual answers', async () => {
  const d = structuredClone(automaticFixture);
  assert.equal(
    validarHistoricoCompra(d, 1).descobertas.versao,
    'automaticas-1',
  );
  assert.equal(d.contextual.declaracoes.length, 0);
  assert.equal(
    d.historico.frequencia.comparacao.disponibilidade,
    'INDISPONIVEL',
  );
  const h = screen(d);
  h.renderer.update({ compraId: 1, revisao: 0 });
  await h.renderer.flush();
  assert.ok(
    h.content().includes('Acima da faixa dos seus registros anteriores'),
  );
  assert.ok(
    h.content().includes('O que ajuda a entender o valor desta compra?'),
  );
  h.renderer.unmount();
});
test('unknown versions, excessive findings, invalid chart values and fabricated usage cannot render', () => {
  for (const mutate of [
    (d) => (d.descobertas.versao = 'unknown'),
    (d) => (d.dependenciasHistoricas.versaoDescobertas = 'unknown'),
    (d) => d.descobertas.itens.push(...d.descobertas.itens),
    (d) => (d.descobertas.itens[0].grafico.pontos[0].valor = -1),
    (d) =>
      (d.monitoramento = {
        disponibilidade: 'PARCIAL',
        minutosRegistrados: 0,
        dias: [],
        referencias: [],
        associacaoComCompra: 'DISPONIVEL',
      }),
  ]) {
    const d = response();
    mutate(d);
    assert.throws(() => validarHistoricoCompra(d, 1));
  }
  assert.equal(
    validarHistoricoCompra(structuredClone(fixture), 1).versaoContrato,
    1,
  );
});
test('monthly usage stays independent and is not presented as an observation about a purchase', async () => {
  const d = response();
  d.monitoramento = {
    disponibilidade: 'PARCIAL',
    dias: ['2026-10-02'],
    minutosRegistrados: 10,
    referencias: ['tempo-uso:1'],
    associacaoComCompra: 'INDISPONIVEL',
    porDia: [{ data: '2026-10-02', minutos: 10 }],
    porAplicativo: [
      { packageId: 'com.shopee.br', nome: 'Shopee', minutos: 10 },
    ],
  };
  const h = screen(d);
  await h.renderer.flush();
  assert.ok(!h.content().includes('10 min registrados em 1 dia'));
  assert.ok(!h.content().includes('Shopee'));
  assert.ok(h.content().includes('R$ 100,00'));
  h.background();
  await h.renderer.flush();
  assert.ok(!h.content().includes('Shopee'));
  assert.ok(!h.content().includes('10 min'));
  h.renderer.unmount();
});
test('logout or late responses cannot restore automatic private observations', async () => {
  const h = screen();
  await h.renderer.flush();
  let finish;
  h.client.get = () =>
    new Promise((r) => {
      finish = r;
    });
  h.press('Atualizar descobertas');
  await h.renderer.flush();
  h.abort.abort();
  finish({ data: response() });
  await h.renderer.flush();
  assert.ok(!h.content().includes('R$ 100,00'));
  h.renderer.unmount();
});
