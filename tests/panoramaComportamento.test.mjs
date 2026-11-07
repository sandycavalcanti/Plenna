import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validarComportamentoPanorama, validarPanorama, criarConsultaPanorama } from '../src/services/panoramaComprasService.js';
import { createRenderer } from './helpers/componentRenderer.mjs';
const comportamento = () => JSON.parse(readFileSync(new URL('./fixtures/panoramaComportamento.json',import.meta.url),'utf8'));
const periodo = {modo:'MES',mes:'2026-10',inicio:'2026-10-01T03:00:00.000Z',fimExclusivo:'2026-11-01T03:00:00.000Z',observadoAte:'2026-11-01T03:00:00.000Z',timezone:'America/Sao_Paulo'};
const base = () => ({versaoContrato:1,periodo,universo:3,comContexto:0,comAutopercepcao:0,disponibilidade:'DISPONIVEL',reflexao:'Registros do período.',limitacoes:[]});
const filtros={modo:'MES',mes:'2026-10'};
const text=n=>typeof n==='object'&&n?(n.props?.children??[]).map(text).join(''):n==null||typeof n==='boolean'?'':String(n);
function disponivel() {
  const v=comportamento();v.comparacao={disponibilidade:'DISPONIVEL',motivos:[],atual:{inicio:periodo.inicio,fimExclusivo:'2026-10-31T03:00:00.000Z'},anterior:{inicio:'2026-09-01T03:00:00.000Z',fimExclusivo:'2026-10-01T03:00:00.000Z'},frequencia:{atual:3,anterior:2,diferenca:1},medianaCentavos:{atual:3.5,anterior:1.5,diferenca:2}};return v;
}
test('bloco estritamente negociado preserva resposta antiga e recusa ausência se solicitado',()=>{
  const d=base();assert.equal(validarPanorama(d,{mes:'2026-10'},false),d);assert.equal(Object.hasOwn(d,'comportamento'),false);
  assert.throws(()=>validarPanorama(d,{mes:'2026-10'},false,true));
  const v={...base(),comportamento:comportamento()};assert.equal(validarPanorama(v,{mes:'2026-10'},false,true),v);
  assert.equal(validarComportamentoPanorama(disponivel(),periodo,3).comparacao.medianaCentavos.atual,3.5);
});
test('validar propriedade estrutural, contagens e origem impede campos privados e inferências',()=>{
  for(const mutate of [v=>v.usuarioId=7,v=>v.recorrencias.origem='INFERIDO',v=>v.recorrencias.cobertura='COMPLETA',v=>v.recorrencias.comprasVinculadas=4,
    v=>v.recorrencias.comprasVinculadas=-1,v=>v.recorrencias.vinculosDistintos=3,v=>v.recorrencias.comprasVinculadas=0,v=>v.recorrencias.vinculosDistintos=0,
    v=>v.recorrencias.compraId=1,v=>v.versaoContrato=2,v=>v.comparacao.frequencia={atual:3,anterior:1,diferenca:2},v=>v.comparacao.motivos=[]]) {
    const v=comportamento();mutate(v);assert.throws(()=>validarComportamentoPanorama(v,periodo,3));
  }
});
test('comparações exigem períodos equivalentes e mediana coerente, sem transformar ausência em zero',()=>{
  for(const mutate of [v=>v.comparacao.anterior.fimExclusivo='2026-09-30T03:00:00Z',v=>v.comparacao.atual.fimExclusivo='2026-11-02T03:00:00Z',
    v=>v.comparacao.atual.inicio='2026-10-02T03:00:00Z',v=>v.comparacao.frequencia.diferenca=2,v=>v.comparacao.medianaCentavos.diferenca=999,
    v=>v.comparacao.medianaCentavos.atual=3.3,v=>v.comparacao.medianaCentavos.atual=Infinity,v=>v.comparacao.medianaCentavos.anterior=-1,
    v=>v.comparacao.medianaCentavos=null,v=>v.comparacao.atual=null]) {
    const v=disponivel();mutate(v);assert.throws(()=>validarComportamentoPanorama(v,periodo,3));
  }
  assert.throws(()=>validarComportamentoPanorama(disponivel(),{...periodo,modo:'TODOS',inicio:null},3));
  const partial=disponivel();partial.comparacao.medianaCentavos=null;partial.comparacao.motivos=['HISTORICO_OU_VALORES_INSUFICIENTES'];assert.ok(validarComportamentoPanorama(partial,periodo,3));
});
test('uma consulta opcional, sem escrita; resumo continua sem parâmetro e requisição antiga é cancelada',async()=>{
  const calls=[],states=[],pending=[],abort=new AbortController();
  const q=criarConsultaPanorama({filtros,storage:{captureSession:async()=>({id:7,signal:abort.signal}),assertSession(){if(abort.signal.aborted)throw Error('SESSION_REQUIRED');}},
    client:{get:(url,config)=>{calls.push({url,config});return new Promise(resolve=>pending.push(()=>resolve({data:{...base(),...(config.params.comportamento?{comportamento:comportamento()}:{})}})));}},onChange:s=>states.push(s)});
  const a=q.consultar();await new Promise(r=>setImmediate(r));assert.deepEqual(calls[0].config.params,{mes:'2026-10',detalhes:'0'});
  const b=q.consultar(false,true);await new Promise(r=>setImmediate(r));assert.equal(calls[0].config.signal.aborted,true);assert.equal(calls.length,2);
  assert.deepEqual(calls[1].config.params,{mes:'2026-10',detalhes:'0',comportamento:'1'});pending[1]();await b;assert.ok(states.at(-1).dados.comportamento);
  pending[0]();await a;assert.ok(states.at(-1).dados.comportamento);abort.abort();assert.deepEqual(states.at(-1),{status:'session',dados:null});q.dispose();
});
test('contrato inválido não vira vazio ou contagem antiga',async()=>{
  const states=[],abort=new AbortController();let bad=false;
  const q=criarConsultaPanorama({filtros,storage:{captureSession:async()=>({id:1,signal:abort.signal}),assertSession(){}},client:{get:async()=>({data:{...base(),comportamento:bad?{...comportamento(),versaoContrato:2}:comportamento()}})},onChange:s=>states.push(s)});
  await q.consultar(false,true);assert.equal(states.at(-1).status,'ready');bad=true;await q.consultar(false,true);assert.deepEqual(states.at(-1),{status:'error',dados:null});q.dispose();
});
test('apresentação compacta distingue vínculo registrado de previsão e explica indisponibilidade',async()=>{
  const h=createRenderer();h.mount(h.load('src/components/PurchaseComponents/PanoramaCompras/ComportamentoPeriodo.js').default,{dados:comportamento()});await h.flush();
  const shown=()=>h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(shown(),/2 compras com vínculo de recorrência registrado/);assert.match(shown(),/cobertura suficiente/);assert.doesNotMatch(shown(),/score|impulsiv|assinatura|previsão|tendência|TOTAL|R\$/i);
  const zero=comportamento();zero.recorrencias.comprasVinculadas=zero.recorrencias.vinculosDistintos=0;zero.comparacao.motivos=['COMPARACAO_APENAS_PARA_MES'];h.update({dados:zero});await h.flush();assert.match(shown(),/Nenhuma compra deste período tem vínculo/);assert.match(shown(),/apenas para meses/);
  h.update({dados:undefined});await h.flush();assert.equal(h.nodes(n=>n.type==='Text').length,0);h.unmount();
});
test('intervalos e mediana por compra mantêm meio centavo sem arredondar para outro valor',async()=>{
  const h=createRenderer();h.mount(h.load('src/components/PurchaseComponents/PanoramaCompras/ComportamentoPeriodo.js').default,{dados:disponivel()});await h.flush();
  const shown=h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(shown,/1 compra a mais/);assert.match(shown,/01\/09\/2026 a 30\/09\/2026/);assert.match(shown,/01\/10\/2026 a 30\/10\/2026/);
  assert.match(shown,/0,015/);assert.match(shown,/0,035/);assert.match(shown,/não é gasto mensal/);h.unmount();
});
