import test from 'node:test';
import assert from 'node:assert/strict';
import {apresentarDadosObjetivos} from '../src/components/PurchaseComponents/AnaliseCompra/dimensoes.js';

const compra = () => ({compra_id:1,compra_ativo:1,compra_status:'CONFIRMADA',compra_valor:'125.50',tb_compra_item:[{compra_item_id:10},{compra_item_id:11}]});
const opcoes = {compraId:1,itensPermitidos:[10,11]};
test('registro objetivo independe de contexto e avaliação; nunca classifica',()=>{
  const c=compra(),before=structuredClone(c),d=apresentarDadosObjetivos(c,opcoes);
  assert.match(d.observacao,/125,50/);assert.ok(d.pergunta);assert.deepEqual(c,before);
  assert.doesNotMatch(JSON.stringify(d),/impulsiv|compulsiv|promoção|planejada/);
});
test('compras protegidas, canceladas, excluídas ou em verificação não fornecem observação',()=>{
  for(const restricao of ['COMPRA_OCULTA','CANCELAMENTO_REGISTRADO','VERIFICANDO_COMPRA','VERIFICACAO_INDISPONIVEL'])
    assert.equal(apresentarDadosObjetivos(compra(),{...opcoes,restricao}),null);
  for(const c of [null,{...compra(),compra_ativo:0},{...compra(),compra_status:'IGNORADA'},{...compra(),compra_id:2}])
    assert.equal(apresentarDadosObjetivos(c,opcoes),null);
});
test('itens pessoais ou removidos não revelam valor total nem nomes; permissões ausentes falham fechadas',()=>{
  assert.equal(apresentarDadosObjetivos(compra(),{compraId:1}),null);
  const d=apresentarDadosObjetivos(compra(),{compraId:1,itensPermitidos:[10]});
  assert.match(d.observacao,/1 item visível/);assert.doesNotMatch(d.observacao,/125|11/);
  assert.equal(apresentarDadosObjetivos(compra(),{compraId:1,itensPermitidos:[]}),null);
});
test('valor ausente não vira zero; zero real é válido; valores inválidos não são apresentados',()=>{
  for(const valor of [null,undefined,'',-1,'inválido',Infinity,Number.MAX_VALUE]) {
    const d=apresentarDadosObjetivos({...compra(),compra_valor:valor},opcoes);
    assert.match(d.observacao,/2 itens visíveis/);assert.doesNotMatch(d.observacao,/R\$/);
  }
  assert.match(apresentarDadosObjetivos({...compra(),compra_valor:0},opcoes).observacao,/0,00/);
});
