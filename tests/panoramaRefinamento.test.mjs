import test from 'node:test';
import assert from 'node:assert/strict';
import {comporPeriodo,consultaLegivel,detalheFator,fatoresPeriodo,periodoLegivel} from '../src/components/PurchaseComponents/PanoramaCompras/detalhamento.js';
import {criarConsultaPanorama} from '../src/services/panoramaComprasService.js';
import {createRenderer} from './helpers/componentRenderer.mjs';

const filtros={modo:'MES',mes:'2026-10'};
const indicador=(codigo,condicao,validos)=>({codigo,condicao,validos});
const dados=()=>({universo:8,comContexto:5,comAutopercepcao:3,sinais:[indicador('PROMOCAO',2,4),indicador('PARCIAL',3,5),indicador('NECESSIDADE',0,2)],relacoes:[indicador('PROMOCAO_IMPULSO',1,3)],habitos:{categorias:[{nome:'Minha categoria personalizada',compras:4}],categoriasValidas:6,diasSemana:[{dia:6,compras:6},{dia:1,compras:2}]},limitacoes:[]});
const texto=n=>typeof n==='string'||typeof n==='number'?String(n):n?.props?.children?.map(texto).join('')||'';
test('períodos legíveis e horário real no fuso São Paulo',()=>{
  assert.equal(periodoLegivel(filtros),'Outubro de 2026');
  assert.equal(periodoLegivel({modo:'INTERVALO',inicio:'01/10/2026',fim:'15/10/2026'}),'01 a 15 de outubro de 2026');
  assert.match(periodoLegivel({modo:'INTERVALO',inicio:'2026-09-30',fim:'2026-10-02'}),/setembro.*outubro/);
  assert.equal(periodoLegivel({modo:'TODOS'}),'Todo o histórico');
  assert.equal(consultaLegivel('2026-11-07T11:15:00Z'),'Dados consultados em 07/11, às 08h15');
  assert.equal(consultaLegivel(null),null);
});
test('seleção estável considera tempo e categorias sem priorizar promoção; relações isoladas não viram padrão',()=>{
  const d=dados(),a=comporPeriodo(d);assert.equal(a.destaque.id,'tempo:fim');assert.equal(a.reflexao.id,'categoria:Minha categoria personalizada');assert.equal(a.relacoes.length,0);
  assert.deepEqual(comporPeriodo(structuredClone(d)),a);
  d.habitos.diasSemana=[{dia:1,compras:8}];assert.equal(comporPeriodo(d).destaque.id,'categoria:Minha categoria personalizada');
  d.relacoes=[indicador('PROMOCAO_IMPULSO',7,8),indicador('PARCIAL_ITENS',3,5)];
  const b=comporPeriodo(d);assert.equal(b.destaque.id,'relacao:PROMOCAO_IMPULSO');assert.ok(!b.relacoes.some(v=>`relacao:${v.codigo}`===b.destaque.id||`relacao:${v.codigo}`===b.reflexao.id));
  assert.notEqual(b.destaque.observacao,b.reflexao.observacao);
});
test('zero/uma compra e ausência de contexto têm estados neutros sem tendência inventada',()=>{
  for(const universo of [0,1]){const d={universo,sinais:[],relacoes:[],habitos:{categorias:[],diasSemana:[]}};const r=comporPeriodo(d);assert.equal(r.destaque.id,'objetivo');assert.equal(r.reflexao.pergunta,null);assert.notEqual(r.destaque.observacao,r.reflexao.observacao);}
  const d=dados();d.sinais=[];assert.equal(comporPeriodo(d).destaque.id,'tempo:fim');
});
test('fatores mantêm cobertura, negativos e ausência separados; classificação não vira contexto',()=>{
  const sinais=[...dados().sinais,indicador('CLASSIFICADA_IMPULSIVA',8,8),indicador('IMPULSO',1,3),indicador('SEM_IMPULSO',2,3)];
  const f=fatoresPeriodo(sinais);assert.ok(!f.some(v=>v.codigo.startsWith('CLASSIFICADA')));assert.ok(f.some(v=>v.codigo==='SEM_IMPULSO'));
  const p=f.find(v=>v.codigo==='PROMOCAO');assert.match(p.descricao,/2 compras/);assert.deepEqual(detalheFator(p,8),['4 compras com resposta válida sobre este fator.','2 compras com resposta “não”.','4 compras sem resposta válida; ausência, recusa e “não lembro” não são respostas negativas.']);
  assert.match(f.find(v=>v.codigo==='NECESSIDADE').descricao,/Nenhuma ocorrência/);
});
test('tela usa ícone genérico para categoria personalizada, três fatores e detalhes individuais sem consultas',async()=>{
  const h=createRenderer();h.mount(h.load('src/components/PurchaseComponents/PanoramaCompras/DetalhesPeriodo.js').default,{dados:dados(),filtros,consultadoEm:'2026-11-07T11:15:00Z'});await h.flush();
  const texts=()=>h.nodes(n=>n.type==='Text').map(texto).join(' ');
  assert.match(texts(),/Minha categoria personalizada/);assert.match(texts(),/08h15/);assert.doesNotMatch(texts(),/2026-10|1 de 2|Relações relevantes/);
  assert.ok(h.nodes(n=>n.props.name==='shopping-outline').length>0);
  const buttons=h.nodes(n=>n.props.accessibilityLabel?.startsWith('Detalhes de'));assert.equal(buttons.length,3);buttons.find(n=>n.props.accessibilityLabel==='Detalhes de Promoções').props.onPress();await h.flush();assert.match(texts(),/4 compras com resposta válida/);
  h.nodes(n=>n.props.accessibilityLabel==='Detalhes de Planejamento parcial')[0].props.onPress();await h.flush();assert.doesNotMatch(texts(),/4 compras com resposta válida/);assert.match(texts(),/5 compras com resposta válida/);
  h.unmount();
});
test('categorias conhecidas reutilizam os ícones existentes; listas agregadas permanecem limitadas',async()=>{
  const d=dados();d.habitos.categorias=[{nome:'Hobbies e lazer',compras:3},{nome:'Presentes',compras:2},{nome:'Saúde',compras:1},{nome:'Quarta categoria',compras:1}];
  const h=createRenderer();h.mount(h.load('src/components/PurchaseComponents/PanoramaCompras/DetalhesPeriodo.js').default,{dados:d,filtros});await h.flush();
  for(const name of ['gamepad-variant','gift','medical-bag'])assert.ok(h.nodes(n=>n.props.name===name).length>0,name);
  assert.doesNotMatch(h.nodes(n=>n.type==='Text').map(texto).join(' '),/Quarta categoria/);h.unmount();
});
test('consulta marca horário apenas após sucesso validado e falha não fabrica horário nem cache',async()=>{
  const abort=new AbortController(),states=[];let fail=false;
  const d={versaoContrato:1,periodo:{modo:'TODOS',inicio:null,fimExclusivo:'2026-11-08T03:00:00Z',observadoAte:'2026-11-07T11:00:00Z',timezone:'America/Sao_Paulo'},universo:0,comContexto:0,comAutopercepcao:0,disponibilidade:'SEM_DADOS',reflexao:'Vazio',limitacoes:[]};
  const q=criarConsultaPanorama({filtros:{modo:'TODOS'},storage:{captureSession:async()=>({id:1,signal:abort.signal}),assertSession(){}},client:{get:async()=>{if(fail)throw Error('offline');return {data:d};}},onChange:v=>states.push(v)});
  const before=Date.now();await q.consultar();const ready=states.at(-1);assert.ok(Date.parse(ready.consultadoEm)>=before);assert.ok(Date.parse(ready.consultadoEm)<=Date.now());
  fail=true;await q.consultar();assert.equal(states.at(-1).status,'error');assert.equal(states.at(-1).consultadoEm,undefined);assert.equal(states.at(-1).dados,null);q.dispose();
});
