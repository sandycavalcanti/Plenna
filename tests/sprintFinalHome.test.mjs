import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transformSync} from '@babel/core';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
async function pure(path){return import('data:text/javascript;base64,'+Buffer.from(await read(path)).toString('base64'));}
const {destaquesHome,unificarDestaquesHome}=await pure('src/utils/destaquesHome.js');
const {formatarValorMoedaParaTela}=await pure('src/components/CustomTextInput/currency.js');
const {distribuicaoClassificacoes}=await pure('src/utils/distribuicaoClassificacoes.js');
const {apresentarMeiaLua}=await pure('src/utils/meiaLuaHome.js');
const clock=new Date('2026-10-14T12:00:00Z');
test('highlights empty, single, three, stable ordering and aggregation without duplicates',()=>{
 assert.deepEqual(destaquesHome(null,[],0,clock),[]);
 assert.equal(destaquesHome(null,[],2,clock).length,1);
 const data={orcamento:{excessoConhecidoCentavos:3000}};
 const goals=Array.from({length:8},(_,id)=>({id,concluida:false,data:'2026-09-01T00:00:00Z'}));
 const result=destaquesHome(data,goals,4,clock);
 assert.equal(result.length,3);assert.equal(new Set(result.map(x=>x.codigo)).size,3);
 assert.deepEqual(result.map(x=>x.prioridade),[1,2,3]);
 assert.deepEqual(result,destaquesHome(data,goals,4,clock));
 assert.doesNotMatch(JSON.stringify(result),/compra_id|categoria|IMPULSIVA/);
 assert.equal(destaquesHome(null,[{concluida:true,data:'2020-01-01'}],0,clock).length,0);
 assert.equal(destaquesHome(null,[{data:'invalid'}],0,clock).length,0);
});
test('goal date is an invitation to review, never evidence of failed financial progress',()=>{
 const result=destaquesHome(null,[{data:'2026-10-13T12:00:00Z',concluida:false}],0,clock);
 assert.match(result[0].mensagem,/não comprova/);
 assert.deepEqual(destaquesHome(null,[{data:'2026-10-15',concluida:false}],0,clock),[]);
});
for(const [percent,state] of [[0,'VERDE'],[16.6,'VERDE'],[49,'VERDE'],[50,'AMARELO'],[74,'AMARELO'],[75,'LARANJA'],[86,'LARANJA'],[100,'LARANJA'],[115,'VERMELHO']]){
 test('known utilization with unknown coverage '+percent,()=>{
  const result=apresentarMeiaLua({financeiro:{qualidade:'PARCIAL',cobertura:'DESCONHECIDA',totalConhecidoCentavos:Math.round(percent*100)},orcamento:{valorCentavos:10000,disponibilidade:'REFERENCIA_ATUAL',percentualConhecido:percent,excessoConhecidoCentavos:percent>100?1500:null}});
  assert.equal(result.estado,percent>100?state:'NEUTRO');assert.equal(result.progresso,Math.min(percent/100,1));assert.equal(result.percentual,percent);
  assert.equal(result.restante,Math.max(0,10000-Math.round(percent*100)));
 });
}
test('classification distribution counts each complete population once and distinguishes pending',()=>{
 const result=distribuicaoClassificacoes([{compra_classificacao:'IMPULSIVA',quantidade:1,quantidade_total:2,quantidade_sem_valor:1},{compra_classificacao:'PENDENTE',quantidade:0,quantidade_total:2,quantidade_sem_valor:2}]);
 assert.equal(result.total,4);assert.equal(result.comprasSemValor,3);assert.equal(result.groups[0].percentual,50);assert.equal(result.groups[2].percentual,50);assert.equal(result.groups[1].percentual,0);assert.equal(result.coberturaLegada,false);
 assert.equal(distribuicaoClassificacoes([]).total,0);
 assert.equal(distribuicaoClassificacoes([{compra_classificacao:'PENDENTE',quantidade:3}]).coberturaLegada,true);
 assert.equal(distribuicaoClassificacoes([{compra_classificacao:'OTHER',quantidade_total:2}]).groups.at(-1).codigo,'NAO_IDENTIFICADA');
});
const React={createElement:(type,props,...children)=>({type,props:props??{},children})};
const text=t=>Array.isArray(t)?t.map(text).join(' '):t&&typeof t==='object'?text(t.children):t===null||t===undefined||t===false?'':String(t);
const nodes=t=>Array.isArray(t)?t.flatMap(nodes):t&&typeof t==='object'?[t,...nodes(t.children)]:[];
const source=await read('src/components/HomeComponents/MetasHome.js');
const js=transformSync(source.replace(/^import .*;\r?\n/gm,'').replace('export default function','function'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx']}).code;
const component=new Function('React','View','Text','Pressable','ActivityIndicator','useState','formatarValorMoedaParaTela',js+';return MetasHome;')(React,'View','Text','Pressable','Spinner',()=>[false,()=>{}],formatarValorMoedaParaTela);
test('goals actual contents, zero one multiple complete unknown and loading failure',()=>{
 const one={id:1,nome:'Viagem',valor:'300',data:'2026-12-01',concluida:false};
 assert.match(text(component({metas:[]})),/Criar uma meta/);
 assert.match(text(component({metas:[one]})),/Viagem/);
 assert.match(text(component({metas:[one]})),/não registra aportes/);
 assert.doesNotMatch(text(component({metas:[one]})),/100%|300,00.*restante/);
 assert.match(text(component({metas:[{...one,concluida:true}]})),/Marcada como concluída/);
 assert.match(text(component({metas:[{...one,valor:null,data:'invalid'}]})),/Valor não informado/);
 assert.doesNotMatch(text(component({metas:[{...one,valor:'bad',data:'invalid'}]})),/NaN|Invalid Date/);
 const many=[one,{...one,id:2,nome:'Curso'},{...one,id:3,nome:'Reserva'}];
 assert.match(text(component({metas:many})),/Ver as 3 metas/);assert.doesNotMatch(text(component({metas:many})),/Reserva/);
 assert.ok(nodes(component({loading:true})).some(x=>x.type==='Spinner'));
 assert.match(text(component({error:true})),/Tentar novamente/);
});
const hookSource=(await read('src/hooks/useMetasHome.js')).replace(/^import .*;\r?\n/gm,'').replace('export function','function');
function harness(get,session){
 let state;let focus;const refs=[];
 const hook=new Function('useCallback','useRef','useState','useFocusEffect','apiClient','tokenStorage',hookSource+';return useMetasHome();')(x=>x,x=>{const ref={current:x};refs.push(ref);return ref;},x=>{state=x;return[x,x=>state=x];},x=>focus=x,{get},session);
 return {hook,state:()=>state,focus:()=>focus()};
}
const raw={meta_id:1,meta_titulo:'Meta',meta_valor:'100',meta_data:null,meta_completado:false};
test('goal GET uses captured session only; failure and revoked session clear data',async()=>{
 const controller=new AbortController();const calls=[];
 const h=harness(async(path,options)=>{calls.push({path,options});return{data:[raw]};},{captureSession:async()=>({id:7,signal:controller.signal}),assertSession(){}});
 await h.hook.refresh();assert.equal(h.state().metas.length,1);assert.equal(calls[0].path,'/goals');assert.equal(calls[0].options.rf017SessionId,7);
 controller.abort();assert.deepEqual(h.state().metas,[]);assert.equal(h.state().error,true);
 for(const get of [async()=>{throw Error('secret');},async()=>({data:[raw,raw]}),async()=>({data:{}})]){
  const c=new AbortController();const h=harness(get,{captureSession:async()=>({id:1,signal:c.signal}),assertSession(){}});
  await h.hook.refresh();assert.equal(h.state().error,true);assert.equal(h.state().metas.length,0);
 }
 const none=harness(async()=>{throw Error('must not call');},{captureSession:async()=>null});
 await none.hook.refresh();assert.equal(none.state().error,true);
});
test('late goal response cannot override newer request or screen cleanup',async()=>{
 const controller=new AbortController();const queue=[];
 const h=harness(()=>new Promise(resolve=>queue.push(resolve)),{captureSession:async()=>({id:1,signal:controller.signal}),assertSession(){}});
 const a=h.hook.refresh();await new Promise(r=>setImmediate(r));
 const b=h.hook.refresh();await new Promise(r=>setImmediate(r));
 queue[1]({data:[{...raw,meta_titulo:'Nova'}]});await b;
 queue[0]({data:[raw]});await a;assert.equal(h.state().metas[0].nome,'Nova');
 const cleanup=h.focus();await new Promise(r=>setImmediate(r));cleanup();queue[2]({data:[raw]});await new Promise(r=>setImmediate(r));assert.equal(h.state().metas.length,0);
});
test('Home hierarchy consumes safe summary and actual goals without old shortcuts',async()=>{
 const s=await read('src/pages/HomeScreen/index.js');
 assert.doesNotMatch(s,/ResumoInterativo|Explore seu consumo|Seus próximos passos|useAnaliseComportamento|fetchCompras/);
 assert.ok(s.indexOf('<CardFinanceiroHome')<s.indexOf('<MetasHome'));assert.ok(s.indexOf('<MetasHome')<s.indexOf('Tempo em aplicativos'));
 assert.doesNotMatch(s,/navigate\('Dashboard',\s*\{\s*periodo/);
 assert.match(s,/itensParaVoce\.map/);
});

test('Home usage preserves seconds without inventing limits',async()=>{
 const s=(await read('src/utils/resumoTempoUso.js')).replace(/^import .*;\r?\n/gm,'');
 const {formatarTempoUso}=await import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'));
 assert.equal(formatarTempoUso(26),'26s');
 assert.equal(formatarTempoUso(86),'1m 26s');
 assert.equal(formatarTempoUso(3601),'1h 1s');
 assert.equal(formatarTempoUso(0),'--');
});

test('goal calendar date preserves its day and today is not overdue',()=>{
 assert.deepEqual(destaquesHome(null,[{data:'2026-10-14T00:00:00Z',concluida:false}],0,clock),[]);
 assert.match(text(component({metas:[{id:1,nome:'Objetivo',valor:100,data:'2026-12-01T00:00:00Z',concluida:false}]})),/01\/12\/2026/);
});

test('Home unifica recomendações persistidas e destaques locais por contexto',()=>{
 const local=[
  {codigo:'ORCAMENTO_EXCEDIDO',titulo:'Orçamento ultrapassado',mensagem:'Aviso local',acao:'dashboard'},
  {codigo:'NOTIFICACOES',titulo:'Há avisos para você',mensagem:'1 aviso',acao:'notificacoes'},
 ];
 const recommendations=[
  {id:10,tipo:'ORCAMENTO_EXCEDIDO',titulo:'Atenção ao orçamento',texto:'Veja as despesas do mês.'},
  {id:11,tipo:'ORCAMENTO_EXCEDIDO',titulo:'Outro alerta',texto:'Evite repetir o excesso.'},
 ];
 const result=unificarDestaquesHome(recommendations,local,true);
 assert.deepEqual(result.map(item=>item.tipoItem),['RECOMENDACAO','DESTAQUE_LOCAL']);
 assert.equal(result[0].id,10);
 assert.equal(result[1].codigo,'NOTIFICACOES');
 assert.equal(unificarDestaquesHome(recommendations,local,false).length,2);
});

test('Home exibe metas na mesma unidade usada pelo Perfil',()=>{
 const values=[[500,'R$ 5,00'],[50000,'R$ 500,00'],[125050,'R$ 1.250,50'],[5000000,'R$ 50.000,00']];
 for(const [valor,esperado] of values){
  const output=text(component({metas:[{id:1,nome:'Cadeira Gamer',valor,data:null,concluida:false}]}));
  assert.match(output,new RegExp(esperado.replace(/[.$]/g,'\\$&')));
 }
});
