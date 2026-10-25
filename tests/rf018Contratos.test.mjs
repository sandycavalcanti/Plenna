import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarAnaliseAutomatica } from '../src/services/analiseAutomaticaService.js';
import { validarContexto } from '../src/services/contextoCompraService.js';

test('uma sessão revogada impede a consulta automática antes de enviar dados', async () => {
  let chamadas = 0;
  await assert.rejects(consultarAnaliseAutomatica({
    storage: { assertSession() { throw Error('SESSION_REVOKED'); } },
    session: { id: 1, signal: new AbortController().signal }, compraId: 1,
    client: { get() { chamadas++; } },
  }), /SESSION_REVOKED/);
  assert.equal(chamadas, 0);
});
test('o contrato contextual recusa uma resposta pertencente a outra compra', () => {
  assert.throws(() => validarContexto({
    versaoContrato: 1, compraId: 2, revisao: 0, criadaEm: null, respostas: {}, itens: [],
  }, 1));
});
