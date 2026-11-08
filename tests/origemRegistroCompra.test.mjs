import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';

const text = n => typeof n === 'string' || typeof n === 'number' ? String(n) : n?.props?.children?.map(text).join('') || '';
const purchase = { compra_id: 1, compra_status: 'CONFIRMADA', compra_valor: 120, tb_compra_item: [] };
const displayed = h => h.nodes(n => n.type === 'Text').map(text).join(' ');

test('Histórico real apresenta devolução e múltiplos reembolsos sem alterar os eventos', async () => {
  const controller = new AbortController();
  const eventos = ['DEVOLUCAO', 'REEMBOLSO', 'REEMBOLSO'].map((tipo, i) => ({
    id: 3 - i, revisao: 3 - i, itemId: null, tipo,
    dados: tipo === 'REEMBOLSO' ? { valorCentavos: 1000 } : {},
    dataEfetiva: null, registradaEm: '2026-11-07T12:00:00Z', corrigido: false, anulado: false,
  }));
  const before = structuredClone(eventos);
  const h = createRenderer({
    '../../api/tokenStorage': { tokenStorage: { captureSession: async () => ({ id: 1, signal: controller.signal }), assertSession() {} } },
    '../../api/client': { apiClient: { get: async () => ({ data: { versaoContrato: 1, compraId: 1, eventos, proximaAntes: null } }) } },
  });
  h.mount(h.load('src/components/PurchaseComponents/HistoricoEventos.js').default, { compraId: 1, compra: purchase });
  await h.flush();
  assert.match(displayed(h), /Devolução/);
  assert.equal(h.nodes(n => n.type === 'Text' && text(n) === 'Reembolso registrado').length, 2);
  assert.deepEqual(eventos, before);
  h.unmount();
});

for (const [origin, label] of [[false, 'Manual'], [true, 'E-mail'], [undefined, 'Não identificada'], [null, 'Não identificada'], [0, 'Não identificada']]) {
  test(`origem explícita ${String(origin)}: ${label}, preservada após edição`, async () => {
    const h = createRenderer();
    const compra = { ...purchase, compra_email: origin };
    const before = structuredClone(compra);
    h.mount(h.load('src/components/PurchaseComponents/ResumoCompra.js').default, { compra });
    await h.flush();
    assert.match(displayed(h), new RegExp(`Origem do registro ${label}`));
    h.update({ compra: { ...compra, compra_valor: 150, compra_classificacao: 'PLANEJADA', tb_forma_pagamento: { forma_pagamento_nome: 'Débito' } } });
    await h.flush();
    assert.match(displayed(h), new RegExp(`Origem do registro ${label}`));
    assert.deepEqual(compra, before);
    h.unmount();
  });
}

for (const [name, devolucoes, reembolsadoCentavos] of [['sem eventos', 0, 0], ['devolução sem reembolso', 1, 0], ['parcial', 1, 1000], ['integral', 1, 12000], ['múltiplos', 2, 3000]]) {
  test(`aba Compra sem textos redundantes: ${name}; Histórico acessível`, async () => {
    const events = { resumo: { devolucoes, reembolsadoCentavos, cancelamentos: 0, itensOcultos: [] }, eventos: [], revisao: 1 };
    const before = structuredClone(events);
    const controller = new AbortController();
    const h = createRenderer({
      '../../../hooks/useEstadoCompra': { useEstadoCompra: () => ({ data: events, loading: false }) },
      '../../../api/tokenStorage': { tokenStorage: { captureSession: async () => ({ id: 1, signal: controller.signal }), assertSession() {} } },
      '../HistoricoEventos': { __esModule: true, default: ({ active }) => active ? ({ type: 'Text', props: { children: ['Eventos financeiros preservados'] } }) : null },
    });
    h.mount(h.load('src/components/PurchaseComponents/ContextoCompra/index.js').default, { compraId: 1, compra: { ...purchase, compra_email: false }, etapaInicial: 'compra' });
    await h.flush();
    assert.doesNotMatch(displayed(h), /Devolução registrada|Reembolsos informados/);
    assert.match(displayed(h), /Manual/);
    h.nodes(n => n.props.accessibilityRole === 'tab' && text(n) === 'Histórico')[0].props.onPress();
    await h.flush();
    assert.match(displayed(h), /Eventos financeiros preservados/);
    assert.deepEqual(events, before);
    h.unmount();
  });
}

test('Sobre sua compra preserva quatro abas na ordem Contexto, Itens, Análise e Histórico', () => {
  const source = readFileSync(new URL('../src/components/PurchaseComponents/ContextoCompra/index.js', import.meta.url), 'utf8');
  assert.match(source, /\['Contexto', 'Itens', 'Análise', 'Histórico'\]/);
});
