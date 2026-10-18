import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transformSync} from '@babel/core';
const base=new URL('../',import.meta.url);
const helper=await readFile(new URL('src/utils/meiaLuaHome.js',base),'utf8');
const {apresentarMeiaLua}=await import('data:text/javascript;base64,'+Buffer.from(helper).toString('base64'));
const data=(percent,state)=>({financeiro:{qualidade:'COMPLETO',cobertura:'COMPLETA',comprasSemValor:0,totalConhecidoCentavos:percent*200},orcamento:{disponibilidade:'REFERENCIA_ATUAL',valorCentavos:20000,percentualConhecido:percent,estadoUtilizacao:state,excessoConhecidoCentavos:percent>100?(percent-100)*200:0}});
const source=await readFile(new URL('src/components/HomeComponents/CardFinanceiroHome.js',base),'utf8');
const code=transformSync(source.replace(/^import .*;\r?\n/gm,'').replace('export default function','function'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx']}).code;
let expanded=false;
const React={createElement:(type,props,...children)=>({type,props:props||{},children})};
const render=new Function('React','View','Text','Pressable','ActivityIndicator','StyleSheet','Svg','Path','MaterialCommunityIcons','useState','apresentarMeiaLua',code+';return CardFinanceiroHome;')(React,'View','Text','Pressable','Spinner',{create:x=>x},'Svg','Path','Icon',initial=>[expanded,x=>{expanded=x;}],apresentarMeiaLua);
const nodes=t=>Array.isArray(t)?t.flatMap(nodes):t&&typeof t==='object'?[t,...nodes(t.children)]:[];
const text=t=>Array.isArray(t)?t.map(text).join(' '):t&&typeof t==='object'?text(t.children):t==null||t===false?'':String(t);
for(const [p,state,color] of [[0,'VERDE','#267344'],[16.6,'VERDE','#267344'],[86,'LARANJA','#A64C14'],[49,'VERDE','#267344'],[50,'AMARELO','#926500'],[74,'AMARELO','#926500'],[75,'LARANJA','#A64C14'],[100,'LARANJA','#A64C14'],[115,'VERMELHO','#B32646']])test('semicircle '+p+'%',()=>{
 const d=data(p,state),tree=render({dados:d});const chart=apresentarMeiaLua(d);
 assert.equal(chart.progresso,Math.min(1,p/100));assert.equal(chart.cor,color);
 const paths=nodes(tree).filter(n=>n.type==='Path');assert.equal(paths[0].props.d,'M 20 120 A 100 100 0 0 1 220 120');
 assert.equal(paths.length,p===0?1:2);
 if(p>0){assert.equal(paths[1].props.stroke,color);assert.ok(Math.abs(paths[1].props.strokeDashoffset-Math.PI*100*(1-Math.min(1,p/100)))<1e-8);}
 assert.equal((text(tree).match(new RegExp(p+'%','g'))||[]).length,1);
});
test('historical absent invalid and unknown budgets never show percentage or excess',()=>{
 for(const b of [{disponibilidade:'INDISPONIVEL',motivo:'ORCAMENTO_HISTORICO_NAO_COMPROVADO'},{disponibilidade:'REFERENCIA_ATUAL',valorCentavos:0},{disponibilidade:'REFERENCIA_ATUAL',valorCentavos:-1}]) {
 const d={...data(115,'VERMELHO'),orcamento:{...data(115,'VERMELHO').orcamento,...b}};
 const c=apresentarMeiaLua(d);assert.equal(c.percentual,null);assert.equal(c.excesso,null);assert.equal(c.estado,'NEUTRO');
 }
 const d=data(0,'NEUTRO');d.financeiro.qualidade='INSUFICIENTE';assert.equal(apresentarMeiaLua(d).compras,null);
});
test('known partial utilization stays neutral and retains its percentage and caveat',()=>{
 const d=data(49,'NEUTRO');d.financeiro.cobertura='DESCONHECIDA';assert.equal(apresentarMeiaLua(d).estado,'NEUTRO');assert.doesNotMatch(text(render({dados:d})),/Dentro do orçamento/);
 const above=data(115,'VERMELHO');above.financeiro.qualidade='PARCIAL';above.financeiro.comprasSemValor=1;
 assert.match(text(render({dados:above})),/Excesso conhecido/);assert.match(text(render({dados:above})),/sem valor informado/);
});
test('loading error empty and month changes cannot retain previous chart',()=>{
 const d=data(115,'VERMELHO');assert.doesNotMatch(text(render({dados:d,loading:true})),/115%/);
 assert.doesNotMatch(text(render({dados:d,error:true})),/115%/);
 const empty=data(0,'NEUTRO');empty.financeiro.qualidade='SEM_COMPRAS';assert.match(text(render({dados:empty})),/Sem compras confirmadas/);
 const historic={...d,orcamento:{disponibilidade:'INDISPONIVEL',motivo:'ORCAMENTO_HISTORICO_NAO_COMPROVADO'}};
 assert.match(text(render({dados:historic})),/Orçamento deste mês não disponível/);assert.doesNotMatch(text(render({dados:historic})),/115%|Excesso conhecido/);
});
test('legend expands; responsive layout and accessible noncolor state',()=>{
 expanded=false;let tree=render({dados:data(50,'AMARELO')});assert.doesNotMatch(text(tree),/Verde: abaixo/);
 const toggle=nodes(tree).find(n=>n.type==='Pressable');toggle.props.onPress();tree=render({dados:data(50,'AMARELO')});assert.match(text(tree),/nunca impulsividade/);expanded=false;
 assert.ok(nodes(tree).some(n=>n.props.accessibilityRole==='progressbar'));
 assert.match(source,/flexWrap:'wrap'/);assert.match(source,/minHeight:48/);assert.match(source,/aspectRatio:240\/140/);
});
