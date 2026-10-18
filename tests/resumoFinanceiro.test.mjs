import test from 'node:test';
import assert from 'node:assert/strict';
import { apresentarResumoFinanceiro, periodoMensalUTC } from '../src/utils/resumoFinanceiro.js';
import { readFile } from 'node:fs/promises';
const complete = { total:100, totalConhecido:100, qualidade:'COMPLETO', comprasSemValor:0, orcamentoMensal:200, estadoOrcamento:'DENTRO' };
test('both screens consume backend summary; no financial sum from pending history',async()=>{
  for(const page of ['HomeScreen','DashboardScreen']) {
    const text=await readFile(new URL(`../src/pages/${page}/index.js`,import.meta.url),'utf8');
    if (page === 'DashboardScreen') { assert.match(text,/getDashboardAnalytics/);assert.match(text,/period\?\.total_centavos/);assert.doesNotMatch(text,/fetchCompras/); }
    else { assert.match(text,/useResumoHome/);assert.doesNotMatch(text,/useAnaliseComportamento/);assert.match(text,/dados=\{financeiro.dados\}/);assert.doesNotMatch(text,/fetchCompras|AlertasHabito/); }
  }
  assert.equal(apresentarResumoFinanceiro(complete).total,100);
});
test('partial and insufficient never announce a conclusive within-budget state',()=>{
  const partial=apresentarResumoFinanceiro({...complete,qualidade:'PARCIAL',comprasSemValor:1,estadoOrcamento:'INDETERMINADO'});
  assert.equal(partial.total,100);assert.match(partial.titulo,/parcial/);assert.match(partial.subtitulo,/insuficientes/);
  const insufficient=apresentarResumoFinanceiro({...complete,total:null,qualidade:'INSUFICIENTE',comprasSemValor:1});
  assert.equal(insufficient.total,null);assert.match(insufficient.titulo,/não informado/);
});
test('known zero and empty differ from loading and HTTP failure',()=>{
  assert.equal(apresentarResumoFinanceiro({...complete,total:0}).total,0);
  assert.match(apresentarResumoFinanceiro({...complete,total:0,qualidade:'SEM_COMPRAS'}).titulo,/Sem compras/);
  assert.equal(apresentarResumoFinanceiro(complete,false,true).total,null);
  assert.match(apresentarResumoFinanceiro(complete,false,true).titulo,/Erro/);
  assert.equal(apresentarResumoFinanceiro(complete,true).total,null);
});
test('UTC month boundary and reached/exceeded wording are distinct',()=>{
  assert.equal(periodoMensalUTC(new Date('2026-12-31T23:30:00-03:00')),'2027-01');
  assert.match(apresentarResumoFinanceiro({...complete,estadoOrcamento:'ATINGIDO'}).subtitulo,/atingido/);
  assert.match(apresentarResumoFinanceiro({...complete,estadoOrcamento:'EXCEDIDO'}).subtitulo,/excedido/);
});
