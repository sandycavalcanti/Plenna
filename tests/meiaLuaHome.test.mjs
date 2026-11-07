import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transformSync} from '@babel/core';
const base=new URL('../',import.meta.url);
const helper=await readFile(new URL('src/utils/meiaLuaHome.js',base),'utf8');
const {apresentarMeiaLua,CORES_ORCAMENTO}=await import('data:text/javascript;base64,'+Buffer.from(helper).toString('base64'));
const data=(percent,state)=>({financeiro:{qualidade:'COMPLETO',cobertura:'COMPLETA',comprasSemValor:0,totalConhecidoCentavos:percent*200},orcamento:{disponibilidade:'REFERENCIA_ATUAL',valorCentavos:20000,percentualConhecido:percent,estadoUtilizacao:state,excessoConhecidoCentavos:percent>100?(percent-100)*200:0}});
const source=await readFile(new URL('src/components/HomeComponents/CardFinanceiroHome.js',base),'utf8');
const code=transformSync(source.replace(/^import .*;\r?\n/gm,'').replace('export default function','function'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx']}).code;
const styleSource=await readFile(new URL('src/components/HomeComponents/CardFinanceiroHome.styles.js',base),'utf8');
const awaitStyles=new Function('StyleSheet',styleSource.replace(/^import .*;\r?\n/gm,'').replace('export const','const')+';return styles;')({create:x=>x});
let expanded=false;
const React={createElement:(type,props,...children)=>({type,props:props||{},children})};
const render=new Function('styles','React','View','Text','Pressable','ActivityIndicator','StyleSheet','Svg','Path','MaterialCommunityIcons','useState','apresentarMeiaLua','CORES_ORCAMENTO',code+';return CardFinanceiroHome;')({},React,'View','Text','Pressable','Spinner',{create:x=>x},'Svg','Path','Icon',initial=>[expanded,x=>{expanded=x;}],apresentarMeiaLua,CORES_ORCAMENTO);
const nodes=t=>Array.isArray(t)?t.flatMap(nodes):t&&typeof t==='object'?[t,...nodes(t.children)]:[];
const text=t=>Array.isArray(t)?t.map(text).join(' '):t&&typeof t==='object'?text(t.children):t==null||t===false?'':String(t);
for(const [p,state,color] of [[0,'VERDE','#267344'],[16.6,'VERDE','#267344'],[86,'LARANJA','#A64C14'],[49,'VERDE','#267344'],[50,'AMARELO','#926500'],[74,'AMARELO','#926500'],[75,'LARANJA','#A64C14'],[100,'LARANJA','#A64C14'],[115,'VERMELHO','#B32646']])test('semicircle '+String(p).replace('.', ',')+'%',()=>{
 const d=data(p,state),tree=render({dados:d});const chart=apresentarMeiaLua(d);
 assert.equal(chart.progresso,Math.min(1,p/100));assert.equal(chart.cor,color);
 const paths=nodes(tree).filter(n=>n.type==='Path');assert.equal(paths[0].props.d,'M 20 120 A 100 100 0 0 1 220 120');
 assert.equal(paths.length,p===0?1:2);
 if(p>0){assert.equal(paths[1].props.stroke,color);assert.ok(Math.abs(paths[1].props.strokeDashoffset-Math.PI*100*(1-Math.min(1,p/100)))<1e-8);}
 assert.equal((text(tree).match(new RegExp(String(p).replace('.', ',')+'%','g'))||[]).length,1);
});
test('historical absent invalid and unknown budgets never show percentage or excess',()=>{
 for(const b of [{disponibilidade:'INDISPONIVEL',motivo:'ORCAMENTO_HISTORICO_NAO_COMPROVADO'},{disponibilidade:'REFERENCIA_ATUAL',valorCentavos:0},{disponibilidade:'REFERENCIA_ATUAL',valorCentavos:-1}]) {
 const d={...data(115,'VERMELHO'),orcamento:{...data(115,'VERMELHO').orcamento,...b}};
 const c=apresentarMeiaLua(d);assert.equal(c.percentual,null);assert.equal(c.excesso,null);assert.equal(c.estado,'NEUTRO');
 }
 const d=data(0,'NEUTRO');d.financeiro.qualidade='INSUFICIENTE';assert.equal(apresentarMeiaLua(d).compras,null);
});
for(const qualidade of ['COMPLETO','PARCIAL'])for(const cobertura of ['COMPLETA','PARCIAL','DESCONHECIDA'])test(`original four bands use known values: ${qualidade}/${cobertura}`,()=>{
 for(const [percent,expected,color] of [[0,'VERDE','#267344'],[49.99,'VERDE','#267344'],[50,'AMARELO','#926500'],[74.99,'AMARELO','#926500'],[75,'LARANJA','#A64C14'],[100,'LARANJA','#A64C14'],[100.01,'VERMELHO','#B32646']]){
  // The original API also returns NEUTRO for unknown coverage. The gauge uses
  // percentualConhecido rather than treating that field as its display color.
  const d=data(percent,'NEUTRO');Object.assign(d.financeiro,{qualidade,cobertura,comprasSemValor:qualidade==='PARCIAL'?1:0});
  const chart=apresentarMeiaLua(d);assert.equal(chart.estado,expected);assert.equal(chart.cor,color);assert.equal(chart.percentual,percent);
  const tree=render({dados:d});for(const path of nodes(tree).filter(n=>n.type==='Path'))assert.equal(path.props.stroke,color);
  assert.doesNotMatch(text(tree),/Dentro do orçamento/);
  if(qualidade==='PARCIAL')assert.match(text(tree),/sem valor informado/);
 }
});

test('known partial utilization keeps excess and incomplete-data caveat',()=>{
 const above=data(115,'VERMELHO');above.financeiro.qualidade='PARCIAL';above.financeiro.comprasSemValor=1;
 assert.match(text(render({dados:above})),/Acima do or\u00e7amento/);assert.match(text(render({dados:above})),/sem valor informado/);
});

test('missing financial data and invalid percentages never get a utilization band',()=>{
 const unavailable=[null,{}, {orcamento:data(50).orcamento}, {...data(50),financeiro:{qualidade:'INSUFICIENTE'}}, {...data(50),orcamento:{...data(50).orcamento,valorCentavos:Infinity}}];
 for(const percent of [null,undefined,-1,NaN,Infinity,'50'])unavailable.push({...data(50),orcamento:{...data(50).orcamento,percentualConhecido:percent}});
 for(const d of unavailable){const chart=apresentarMeiaLua(d);assert.equal(chart.estado,'NEUTRO');assert.equal(chart.cor,'#76658A');assert.equal(chart.percentual,null);assert.equal(chart.excesso,null);assert.equal(chart.progresso,0);}
});

test('unknown values hide the arc; a known zero with a valid budget stays zero',()=>{
 const unknown=data(50);unknown.financeiro.qualidade='INSUFICIENTE';
 const tree=render({dados:unknown});assert.equal(nodes(tree).filter(n=>n.type==='Path').length,0);assert.doesNotMatch(text(tree),/50%/);assert.match(text(tree),/Valor não informado/);
 const zero=data(0);zero.financeiro.qualidade='SEM_COMPRAS';const chart=apresentarMeiaLua(zero);assert.equal(chart.percentual,0);assert.equal(chart.estado,'VERDE');assert.match(text(render({dados:zero})),/Sem compras confirmadas/);
});
test('loading error empty and month changes cannot retain previous chart',()=>{
 const d=data(115,'VERMELHO');assert.doesNotMatch(text(render({dados:d,loading:true})),/115%/);
 assert.doesNotMatch(text(render({dados:d,error:true})),/115%/);
 for(const props of [{dados:d,loading:true},{dados:d,error:true},{}])assert.equal(nodes(render(props)).filter(n=>n.type==='Path').length,0);
 const empty=data(0,'NEUTRO');empty.financeiro.qualidade='SEM_COMPRAS';assert.match(text(render({dados:empty})),/Sem compras confirmadas/);
 const historic={...d,orcamento:{disponibilidade:'INDISPONIVEL',motivo:'ORCAMENTO_HISTORICO_NAO_COMPROVADO'}};
 assert.match(text(render({dados:historic})),/Sem orçamento neste mês/);assert.doesNotMatch(text(render({dados:historic})),/115%|Acima do or\u00e7amento/);
});
test('legend expands; responsive layout and accessible noncolor state',()=>{
 expanded=false;let tree=render({dados:data(50,'AMARELO')});assert.doesNotMatch(text(tree),/Verde: abaixo/);
 const toggle=nodes(tree).find(n=>n.type==='Pressable');toggle.props.onPress();tree=render({dados:data(50,'AMARELO')});assert.match(text(tree),/Abaixo de 50%/);expanded=false;
 assert.ok(nodes(tree).some(n=>n.props.accessibilityRole==='progressbar'));
 const styles=awaitStyles;assert.equal(styles.metrics.flexWrap,'wrap');assert.equal(styles.infoButton.minHeight,48);assert.equal(styles.gauge.width,180);assert.equal(styles.gauge.maxWidth,'100%');assert.equal(styles.gauge.height,105);
});
