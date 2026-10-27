import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformSync } from '@babel/core';
const hookSource=await readFile(new URL('../src/hooks/useAnaliseComportamento.js',import.meta.url),'utf8');
const componentSource=await readFile(new URL('../src/components/DashboardComponents/AnaliseComportamento/index.js',import.meta.url),'utf8');
const testStyles=new Proxy({}, {get:()=>({})});
const data=(extra={})=>({versaoContrato:1,analise:{periodo:'2026-10',avaliacao:{estado:'DADOS_INSUFICIENTES'},indicadores:{frequencia:{compras:1},financeiro:{comprasComValor:1,comprasSemValor:0},comparacao:{disponibilidade:'INDISPONIVEL'},categorias:{grupos:[{categoriaId:2,compras:1,participacao:1}],comprasSemCategoria:0}}},categorias:[{id:2,nome:'Outros'}],recomendacoes:{recomendacoes:[{codigo:'REVISAR_LIMITE_INDIVIDUAL',titulo:'Revise seu limite por compra',mensagem:'Confira seu planejamento atual.',referencias:['compra:1'],limitacoes:[]}]},...extra});
function hook(get,periodo='2026-10') {
 let state,sessionId=1,controller=new AbortController();const effects=[];const ref={current:0};
 const tokenStorage={captureSession:async()=>({id:sessionId,signal:controller.signal}),assertSession:id=>{if(id!==sessionId)throw Error('invalid');}};
 const code=hookSource.replace(/^import .*;\r?\n/gm,'').replace('export function','function');
 const result=new Function('useCallback','useRef','useState','useFocusEffect','apiClient','tokenStorage',`${code};return useAnaliseComportamento('${periodo}');`)(fn=>fn,()=>ref,initial=>{state=initial;return[state,next=>{state=next;}];},fn=>effects.push(fn),{get},tokenStorage);
 return {result,focus:()=>{const cleanups=effects.map(f=>f());return()=>cleanups.forEach(f=>f?.());},state:()=>state,changeUser:()=>{sessionId++;controller.abort();controller=new AbortController();}};
}
const React={createElement:(type,props,...children)=>({type,props:props||{},children})};
const code=transformSync(componentSource.replace(/^import .*;\r?\n/gm,'').replace('export default function','function'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx']}).code;
let opened=null;
const Component=new Function('React','View','Text','ActivityIndicator','Pressable','ProfileCard','MaterialCommunityIcons','useState','COLORS','styles',`${code};return AnaliseComportamento;`)(React,'View','Text','ActivityIndicator','Pressable','ProfileCard','Icon',initial=>[opened,next=>{opened=next;}],{dadoTres:'#AFA1E8'},testStyles);
const text=tree=>tree==null||tree===false?'':Array.isArray(tree)?tree.map(text).join(' '):typeof tree==='object'?text(tree.children):String(tree);
test('hook calls authenticated client contract with selected period and accepts response',async()=>{
 const calls=[];const h=hook(async(...args)=>{calls.push(args);return{data:data()};});
 assert.equal(h.result.loading,true);await h.result.refresh();assert.equal(h.state().error,false);assert.equal(h.state().dados.versaoContrato,1);assert.equal(calls[0][0],'/analises/comportamento');assert.equal(calls[0][1].params.periodo,'2026-10');assert.equal(calls[0][1].rf017SessionId,1);assert.ok(calls[0][1].signal);
});
test('HTTP failure or wrong contract/period is error never empty success',async()=>{
 for(const get of [async()=>{throw new Error('offline');},async()=>({data:{}}),async()=>({data:{...data(),analise:{...data().analise,periodo:'2026-09'}}})]) {
  const h=hook(get);await h.result.refresh();assert.equal(h.state().error,true);assert.equal(h.state().dados,null);
 }
});
test('out-of-order responses and blur cannot overwrite latest data',async()=>{
 const pending=[];const h=hook(()=>new Promise(resolve=>pending.push(resolve)));
 const cleanup=h.focus();const refresh=h.result.refresh();await new Promise(r=>setImmediate(r));pending[1]({data:data()});await refresh;pending[0]({data:{}});await new Promise(r=>setImmediate(r));assert.equal(h.state().error,false);
 const next=h.result.refresh();await new Promise(r=>setImmediate(r));cleanup();pending[2]({data:{}});await next;assert.equal(h.state().error,false);
});
test('component separates loading error empty and insufficient; retry is available',()=>{
 assert.match(text(Component({loading:true})),/Carregando/);
 assert.match(text(Component({error:true,onRetry:()=>{}})),/Tentar novamente/);
 const empty=data();empty.analise.indicadores.frequencia.compras=0;empty.recomendacoes.recomendacoes=[];
 assert.match(text(Component({dados:empty})),/Nenhuma compra confirmada/);
 const rendered=text(Component({dados:data()}));assert.doesNotMatch(rendered,/Outubro de 2026/);assert.doesNotMatch(rendered,/avaliação de impulsividade disponível/);assert.match(rendered,/Outros/);assert.match(rendered,/Revise seu limite/);assert.match(rendered,/Ver mais/);assert.doesNotMatch(rendered,/compra:1|Refer?ncias:/);
});
test('component limits recommendations to two, removes redundant coverage copy and does not calculate money',()=>{
 const d=data();d.recomendacoes.recomendacoes=Array.from({length:3},(_,i)=>({...data().recomendacoes.recomendacoes[0],codigo:String(i),titulo:'Orientacao '+i}));
 const rendered=text(Component({dados:d}));assert.match(rendered,/Orientacao 1/);assert.doesNotMatch(rendered,/Orientacao 2/);assert.doesNotMatch(rendered,/apenas os registros/);assert.doesNotMatch(componentSource,/compra_valor|compra_desconto|reduce\(/);
});
test('Dashboard preserves RF016 analytics and integrates RF018 for the selected period',async()=>{
 const s=await readFile(new URL('../src/pages/DashboardScreen/index.js',import.meta.url),'utf8');
 assert.match(s,/getDashboardAnalytics/);assert.match(s,/useAnaliseComportamento\(selectedMonth\)/);assert.match(s,/AnaliseComportamento/);
 for(const name of ['Categoria','TempoApp','Impulsividade','FormaPagamento'])assert.ok(s.includes('<'+name));
 assert.match(s,/comportamento\.refresh\(\)/);assert.match(s,/getDashboardAnalytics\(params/);assert.match(s,/incomingPeriod/);assert.match(s,/onLayout=\{mark\('tempo'\)\}/);
});

test('progressive explanations stay compact, preserve caveats and reset when month changes',()=>{
 opened=null;
 const d=data();
 let tree=Component({dados:d});const compact=text(tree);
 assert.doesNotMatch(compact,/avaliação de impulsividade disponível/);assert.doesNotMatch(compact,/apenas os registros/);assert.match(compact,/vig.ncia hist.rica/);
 assert.doesNotMatch(compact,/Confira seu planejamento atual/);
 const nodes=t=>Array.isArray(t)?t.flatMap(nodes):t&&typeof t==='object'?[t,...nodes(t.children)]:[];
 const toggle=nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Ver mais'));
 assert.equal(toggle.props.accessibilityState.expanded,false);toggle.props.onPress();
 const expandedTree=Component({dados:d});
 assert.doesNotMatch(text(expandedTree),/Confira seu planejamento atual/);
 const recommendation=nodes(expandedTree).find(n=>n.type==='Pressable'&&text(n).includes('Revise seu limite'));
 recommendation.props.onPress();
 assert.match(text(Component({dados:d})),/Confira seu planejamento atual/);
 const next={...d,analise:{...d.analise,periodo:'2026-09'}};
 assert.doesNotMatch(text(Component({dados:next})),/Confira seu planejamento atual/);
 opened=null;
});

test('each recommendation opens independently without exposing references',()=>{
 opened=null;
 const d=data();d.recomendacoes.recomendacoes.push({...d.recomendacoes.recomendacoes[0],codigo:'SECOND',titulo:'Outra orientacao',mensagem:'Segunda justificativa'});
 const nodes=t=>Array.isArray(t)?t.flatMap(nodes):t&&typeof t==='object'?[t,...nodes(t.children)]:[];
 let tree=Component({dados:d});const first=nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Revise seu limite'));
 assert.equal(first.props.accessibilityState.expanded,false);assert.doesNotMatch(text(tree),/Confira seu planejamento atual/);
 first.props.onPress();tree=Component({dados:d});assert.match(text(tree),/Confira seu planejamento atual/);assert.doesNotMatch(text(tree),/Segunda justificativa|compra:1/);
 const next={...d,analise:{...d.analise,periodo:'2026-09'}};assert.doesNotMatch(text(Component({dados:next})),/Confira seu planejamento atual/);
 opened=null;
});

test('session change clears loaded RF018 data immediately and rejects late responses',async()=>{
 const h=hook(async()=>({data:data()}));const cleanup=h.focus();await new Promise(r=>setImmediate(r));assert.ok(h.state().dados);h.changeUser();assert.equal(h.state().dados,null);cleanup();
 let resolve;const j=hook(()=>new Promise(r=>{resolve=r;}));const pending=j.result.refresh();await new Promise(r=>setImmediate(r));j.changeUser();resolve({data:data()});await pending;assert.equal(j.state().dados,null);
});

test('financial comparison preserves dynamic scale with independent bars',async()=>{
 const source=await readFile(new URL('../src/pages/DashboardScreen/index.js',import.meta.url),'utf8');
 assert.match(source,/financialScaleCents\s*=\s*Math\.max\(totalCents, metaCents, 1\)/);
 assert.match(source,/limitBarWidth/);
 assert.match(source,/spentBarWidth/);
 assert.match(source,/metaExcessCents/);
 assert.match(source,/financialBarLimitFill/);
 assert.match(source,/financialBarSpentFill/);
 assert.doesNotMatch(source,/financialBarLegend/);
 assert.doesNotMatch(source,/financialBarLimitMarker/);
});

test('observed patterns preserve the registered-evidence contract without expandable details',async()=>{
 const source=await readFile(new URL('../src/components/DashboardComponents/DescobertasDashboard.js',import.meta.url),'utf8');
 assert.match(source,/d\.tipo === 'REGISTRADO'/);
 assert.match(source,/d\.evidencias\?\.length/);
 assert.match(source,/\.slice\(0, 2\)/);
 assert.match(source,/relatedAction/);
 assert.doesNotMatch(source,/ReadingDetails/);
 assert.doesNotMatch(source,/Sobre estes registros/);
 assert.match(source,/getDiscoveryIcon/);
});
