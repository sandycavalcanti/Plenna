import test from 'node:test';
import assert from 'node:assert/strict';
import {comporInsightsContextuais,fatoresDoInsight} from '../src/components/PurchaseComponents/AnaliseCompra/insightsContextuais.js';

const codes={planejamento:'R2_PLANEJAMENTO',influenciaPromocional:'R4_PROMOCAO',necessidadeInesperada:'R5_NECESSIDADE',momento:'R6_MOMENTO',autopercepcaoImpulsividade:'R8_AUTOPERCEPCAO',planejamentoItem:'R3_ITEM'};
export function avaliacao(respostas={},itens=[]) {
  const r={versaoContrato:1,versaoMotor:'contextual-2',compraId:1,contextoRevisao:2,estado:'CONTEXTO_DISPONIVEL',
    declaracoes:[],observacoes:[],autopercepcao:null,interpretacao:{mensagem:'Resultado original preservado.',reflexao:'Texto original. Pergunta original?',referencias:[]},
    evidencias:[{referencia:'compra:1',natureza:'REGISTRADO'}],regrasAplicadas:[],limitacoes:[]};
  for(const entry of [...Object.entries(respostas).map(([campo,valor])=>({campo,valor})),...itens.map(item=>({...item,campo:'planejamentoItem'}))]) {
    const ref=`contexto:1:revisao:2:${entry.itemId?`item:${entry.itemId}`:entry.campo}`;
    const d={...entry,codigo:codes[entry.campo],mensagem:entry.campo,referencias:[ref]};
    if(entry.campo==='autopercepcaoImpulsividade')r.autopercepcao=d;else r.declaracoes.push(d);
    r.evidencias.push({referencia:ref,natureza:'DECLARADO'});
    r.regrasAplicadas.push({codigo:d.codigo,versao:1,justificativa:'Declaração registrada.',referencias:[ref]});
    r.interpretacao.referencias.push(ref);
  }
  return {versaoContrato:1,compraId:1,avaliacaoId:7,criadaEm:'2026-11-01T12:00:00Z',atualidade:'VIGENTE',motivos:[],resultado:r};
}
const compose=(data,options={})=>comporInsightsContextuais(data,{compraId:1,revisao:2,...options});

test('planejamento parcial, promoção e antecipação produzem relação de três fatores, sem causalidade',()=>{
  const d=avaliacao({planejamento:'PARCIALMENTE',influenciaPromocional:'SIM',momento:'ANTECIPADA'}),before=structuredClone(d);
  const c=compose(d);
  assert.equal(c.principal.tipo,'PLANEJAMENTO_PROMOCAO_MOMENTO');
  assert.equal(c.principal.pergunta,'Você teria comprado agora se a oferta não existisse?');
  assert.match(c.principal.reflexao,/Parte da compra/);assert.match(c.principal.reflexao,/antecipada/);
  assert.doesNotMatch(c.principal.reflexao,/por causa|causou|impulsiva|compuls/);
  assert.equal(fatoresDoInsight(c.principal).length,3);assert.equal(c.origem.tipo,'INSIGHT_DERIVADO');
  assert.equal(c.origem.avaliacaoId,7);assert.deepEqual(d,before);
});

test('necessidade inesperada com falta de planejamento pode prevalecer sobre promoção',()=>{
  const c=compose(avaliacao({planejamento:'NAO',necessidadeInesperada:'SIM',influenciaPromocional:'SIM'}));
  assert.equal(c.principal.tipo,'NECESSIDADE_PLANEJAMENTO');
  assert.match(c.principal.reflexao,/não estava nos seus planos e surgiu uma necessidade inesperada/);
  assert.doesNotMatch(c.principal.reflexao,/impulsiv/);
});

test('compra planejada com itens não planejados usa somente os itens com respostas',()=>{
  const d=avaliacao({planejamento:'SIM'},[{itemId:10,valor:'NAO'},{itemId:11,valor:'SIM'},{itemId:12,valor:'PREFIRO_NAO_RESPONDER'}]);
  d.resultado.limitacoes.push('ITENS_COM_CONTEXTO_AUSENTE');
  const c=compose(d);
  assert.equal(c.principal.tipo,'PLANEJAMENTO_ITENS');
  assert.match(c.principal.reflexao,/entre os itens com resposta, há 1 não planejado/);
  assert.equal(c.principal.evidencias.filter(e=>e.itemId).length,1);
  assert.match(c.principal.relacao,/Itens sem contexto não foram presumidos/);
  const allowed=compose(d,{itensPermitidos:[11,12]});
  assert.equal(allowed.principal.tipo,'DECLARACAO_planejamento');
  assert.equal(allowed.principal.evidencias.some(e=>e.itemId===10),false);
});

test('autopercepção negativa ou positiva não é contradita nem convertida em diagnóstico',()=>{
  for(const valor of ['SIM','NAO']) {
    const c=compose(avaliacao({planejamento:'SIM',autopercepcaoImpulsividade:valor}));
    assert.equal(c.principal.tipo,'AUTOPERCEPCAO_CONTEXTO');
    assert.match(c.principal.reflexao,valor==='SIM'?/você percebeu impulso/:/você não percebeu impulso/);
    assert.match(c.principal.relacao,/não é corrigida nem substituída/);
  }
});

test('evidência única gera reflexão simples; ausência, recusa e desconhecimento não inventam relações',()=>{
  assert.equal(compose(avaliacao({influenciaPromocional:'SIM'})).principal.tipo,'DECLARACAO_influenciaPromocional');
  for(const respostas of [{},{planejamento:'NAO_LEMBRO'},{planejamento:'PREFIRO_NAO_RESPONDER'}]) {
    const c=compose(avaliacao(respostas));assert.equal(c.estado,'SEM_EVIDENCIAS');assert.equal(c.principal,null);assert.deepEqual(c.complementares,[]);
  }
  const d=avaliacao({planejamento:'NAO'});
  d.historico={compras:300,comparavel:false};
  assert.equal(compose(d).principal.tipo,'DECLARACAO_planejamento');
});

test('remoção e alteração de resposta mudam a relação; avaliação antiga nunca vira insight atual',()=>{
  const old=avaliacao({planejamento:'PARCIALMENTE',influenciaPromocional:'SIM',momento:'ANTECIPADA'});
  const removed=avaliacao({planejamento:'PARCIALMENTE',momento:'ANTECIPADA'});removed.avaliacaoId=8;
  assert.equal(compose(removed).principal.tipo,'MOMENTO_PLANEJAMENTO');
  assert.equal(compose(removed).principal.evidencias.some(e=>e.campo==='influenciaPromocional'),false);
  const changed=avaliacao({planejamento:'NAO',necessidadeInesperada:'SIM'});changed.avaliacaoId=9;
  assert.equal(compose(changed).principal.tipo,'NECESSIDADE_PLANEJAMENTO');
  assert.notEqual(compose(old).principal.id,compose(changed).principal.id);
  for(const options of [{revisao:3},{indisponibilidade:'CANCELAMENTO_REGISTRADO'},{indisponibilidade:'CONSENTIMENTO_REVOGADO'},{indisponibilidade:'COMPRA_EXCLUIDA'}]) {
    assert.equal(compose(old,options).principal,null);
  }
  old.atualidade='DESATUALIZADA';assert.equal(compose(old).estado,'DESATUALIZADO');
});

test('evidências de outra revisão, sem regra ou origem declarada não são usadas',()=>{
  for(const change of [
    d=>d.resultado.regrasAplicadas=[],
    d=>d.resultado.evidencias=d.resultado.evidencias.filter(e=>e.natureza!=='DECLARADO'),
    d=>d.resultado.declaracoes[0].referencias=['contexto:1:revisao:1:planejamento'],
    d=>d.compraId=2,
    d=>d.avaliacaoId=null,
    d=>d.criadaEm=null,
    d=>d.motivos=['DADOS_UTILIZADOS_ALTERADOS'],
  ]){
    const d=avaliacao({planejamento:'SIM'});change(d);assert.equal(compose(d).principal,null);
  }
  const d=avaliacao({planejamento:'SIM'});d.resultado.declaracoes.push({...d.resultado.declaracoes[0],valor:'NAO'});
  assert.equal(compose(d).motivo,'EVIDENCIAS_CONFLITANTES');
});

test('R1 usa somente a observação registrada, sem reconstruir valores atuais ou históricos',()=>{
  const d=avaliacao({planejamento:'SIM'}),refs=['compra:1','perfil:limite-atual'];
  d.resultado.observacoes=[{codigo:'LIMITE_EXCEDIDO',mensagem:'O valor supera a referência em R$ 20,00. Isso não determina impulsividade.',referencias:refs}];
  d.resultado.regrasAplicadas.push({codigo:'R1_LIMITE',versao:1,justificativa:'Comparação registrada.',referencias:refs});
  d.resultado.evidencias.push({referencia:'perfil:limite-atual',natureza:'DECLARADO'});
  const c=compose(d),all=[c.principal,...c.complementares];
  const f=all.find(i=>i.tipo==='REFERENCIA_FINANCEIRA');assert.ok(f);assert.match(f.reflexao,/20,00/);
  assert.match(f.relacao,/não comprova um limite vigente/);
  d.resultado.evidencias=d.resultado.evidencias.filter(e=>e.referencia!=='perfil:limite-atual');
  assert.equal([compose(d).principal,...compose(d).complementares].some(i=>i.tipo==='REFERENCIA_FINANCEIRA'),false);
});

test('seleção é estável, independente da ordem e sem complementos redundantes',()=>{
  const d=avaliacao({planejamento:'PARCIALMENTE',influenciaPromocional:'SIM',momento:'ANTECIPADA',necessidadeInesperada:'SIM',autopercepcaoImpulsividade:'NAO'},[{itemId:10,valor:'NAO'},{itemId:11,valor:'SIM'}]);
  const c=compose(d),reordered=structuredClone(d);
  reordered.resultado.declaracoes.reverse();reordered.resultado.evidencias.reverse();reordered.resultado.regrasAplicadas.reverse();
  assert.deepEqual(compose(reordered),c);assert.deepEqual(compose(d),c);
  assert.ok(c.complementares.length<=2);
  const used=new Set(c.principal.evidencias.map(e=>e.campo==='planejamentoItem'?'itens':e.campo));
  for(const i of c.complementares) {
    const fields=i.evidencias.map(e=>e.campo==='planejamentoItem'?'itens':e.campo);
    assert.ok(fields.some(f=>!used.has(f)));fields.forEach(f=>used.add(f));
  }
});

test('combinações parciais mantêm até três fatores no principal e não alteram classificações',()=>{
  for(const p of ['SIM','PARCIALMENTE','NAO','NAO_LEMBRO'])for(const o of ['SIM','NAO'])for(const n of ['SIM','NAO'])for(const m of ['ANTECIPADA','ADIADA','NO_MOMENTO_PREVISTO']) {
    const d=avaliacao({planejamento:p,influenciaPromocional:o,necessidadeInesperada:n,momento:m});
    d.classificacaoVoluntaria='NAO_IMPULSIVA';const before=structuredClone(d),c=compose(d);
    assert.ok(fatoresDoInsight(c.principal).length<=3);assert.ok(c.complementares.length<=2);assert.deepEqual(d,before);
    assert.equal('classificacao' in c,false);assert.equal('probabilidade' in c,false);
  }
});
