import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=new URL('../',import.meta.url);
const util=await readFile(new URL('src/utils/resumoHome.js',base),'utf8');
const {validarResumoHome,financeiroHome}=await import('data:text/javascript;base64,'+Buffer.from(util).toString('base64'));
const fixture=(periodo='2026-10')=>({versaoContrato:1,periodo,referenciaTemporal:'UTC',seletor:{periodoMinimo:'2026-09',periodoMaximo:'2026-10',motivoLimiteInicial:'CRIACAO_CONTA'},financeiro:{comprasConfirmadas:0,comprasComValor:0,comprasSemValor:0,totalConhecidoCentavos:0,totalCentavos:0,qualidade:'SEM_COMPRAS',cobertura:'DESCONHECIDA'},orcamento:{disponibilidade:'INDISPONIVEL',valorCentavos:null,percentualConhecido:null,excessoConhecidoCentavos:null,vigencia:'NAO_COMPROVADA',estadoUtilizacao:'NEUTRO',motivo:'ORCAMENTO_HISTORICO_NAO_COMPROVADO'},limitacoes:[],perspectivas:{categorias:{disponibilidade:'INDISPONIVEL',motivo:'POLITICA_DE_PRIVACIDADE_NAO_VERIFICAVEL'},pagamentos:{disponibilidade:'INDISPONIVEL',motivo:'POLITICA_DE_PRIVACIDADE_NAO_VERIFICAVEL'},estabelecimentos:{disponibilidade:'INDISPONIVEL',motivo:'SEM_IDENTIFICACAO_CONFIAVEL'}}});
test('strict safe contract rejects detailed extras and mismatched period',()=>{
 const f=fixture();assert.equal(validarResumoHome(f,'2026-10'),f);
 for(const extra of [{analise:{}},{compraId:1},{recomendacoes:[]}])assert.throws(()=>validarResumoHome({...f,...extra},'2026-10'));
 assert.throws(()=>validarResumoHome(f,'2026-09'));
 f.perspectivas.categorias.grupos=[{nome:'private'}];assert.throws(()=>validarResumoHome(f,'2026-10'));
});
test('null totals and unavailable historic budget never become zero',()=>{
 const f=fixture();f.financeiro.totalCentavos=null;f.financeiro.qualidade='INSUFICIENTE';
 const summary=financeiroHome(validarResumoHome(f,'2026-10'));assert.equal(summary.total,null);assert.equal(summary.orcamentoMensal,null);
});
const source=await readFile(new URL('src/hooks/useResumoHome.js',base),'utf8');
const code=source.replace(/^import .*;\r?\n/gm,'').replace('export function','function');
function harness(period='2026-10') {
 let state, sessionId=1, controller=new AbortController(), mounted=true;
 const calls=[], pending=[], effects=[], ref={current:0};
 const tokenStorage={captureSession:async()=>({id:sessionId,signal:controller.signal}),assertSession:id=>{if(id!==sessionId)throw Error('invalid');}};
 const apiClient={get:(path,options)=>{calls.push({path,options});return new Promise((resolve,reject)=>pending.push({resolve,reject}));}};
 const hook=new Function('useCallback','useRef','useState','useFocusEffect','apiClient','tokenStorage','validarResumoHome',code+';return useResumoHome;')(fn=>fn,()=>ref,initial=>{state=initial;return[initial,next=>{if(mounted)state=next;}];},fn=>effects.push(fn),apiClient,tokenStorage,validarResumoHome);
 return {hook:hook(period),calls,pending,get state(){return state;},effects,async tick(){await new Promise(r=>setImmediate(r));},changeUser(){sessionId++;controller.abort();controller=new AbortController();},unmount(){mounted=false;}};
}
test('only safe endpoint, loading success and operational error',async()=>{
 const h=harness();const p=h.hook.refresh();await h.tick();assert.equal(h.state.loading,true);assert.equal(h.calls[0].path,'/home/resumo');assert.equal(h.calls[0].options.rf017SessionId,1);
 h.pending[0].resolve({data:fixture()});await p;assert.equal(h.state.error,false);
 const q=h.hook.refresh();await h.tick();h.pending[1].reject(Error('offline'));await q;assert.equal(h.state.dados,null);assert.equal(h.state.error,true);
});
test('late response cannot replace latest refresh',async()=>{
 const h=harness();const first=h.hook.refresh();await h.tick();const second=h.hook.refresh();await h.tick();
 h.pending[1].resolve({data:fixture()});await second;h.pending[0].reject(Error('late'));await first;assert.equal(h.state.error,false);
});
test('session change rejects pending response and clears loaded data',async()=>{
 const h=harness();const cleanup=h.effects[1]();await h.tick();
 const p=h.hook.refresh();await h.tick();h.pending[0].resolve({data:fixture()});await p;assert.ok(h.state.dados);
 h.changeUser();assert.equal(h.state.dados,null);cleanup();
 const j=harness();const q=j.hook.refresh();await j.tick();j.changeUser();j.pending[0].resolve({data:fixture()});await q;assert.equal(j.state.dados,null);
});
test('focus cleanup invalidates response from previous period',async()=>{
 const h=harness('2026-09');const cleanup=h.effects[0]();await h.tick();cleanup();h.pending[0].resolve({data:fixture('2026-09')});await h.tick();assert.equal(h.state.dados,null);
});