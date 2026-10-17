import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformSync } from '@babel/core';
const base=new URL('../',import.meta.url);
const source=await readFile(new URL('src/utils/resumoFinanceiro.js',base),'utf8');
const {apresentarEstadoOrcamento,apresentarResumoFinanceiro}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const summary=(total,extra={})=>({total,totalConhecido:total,orcamentoMensal:200,qualidade:'COMPLETO',comprasSemValor:0,estadoOrcamento:total>200?'EXCEDIDO':'DENTRO',...extra});
for(const [total,state] of [[0,'VERDE'],[99.99,'VERDE'],[100,'AMARELO'],[149.99,'AMARELO'],[150,'LARANJA'],[200,'LARANJA'],[230,'VERMELHO']])test(`budget boundary ${total}`,()=>{
 const r=apresentarEstadoOrcamento(summary(total),false,false,'COMPLETA');assert.equal(r.estado,state);assert.ok(r.progresso<=1);if(total===230)assert.ok(Math.abs(r.percentual-115)<.001);
});
test('partial values and unknown coverage never imply complete consumption',()=>{
 for(const s of [summary(80,{qualidade:'PARCIAL'}),summary(80)])assert.equal(apresentarEstadoOrcamento(s).estado,'NEUTRO');
 assert.equal(apresentarEstadoOrcamento(summary(230,{qualidade:'PARCIAL'})).estado,'VERMELHO');
});
test('missing zero invalid budget unknown values HTTP failure remain neutral',()=>{
 for(const budget of [null,0,-1,NaN])assert.equal(apresentarEstadoOrcamento(summary(80,{orcamentoMensal:budget})).percentual,null);
 assert.equal(apresentarEstadoOrcamento(summary(null,{qualidade:'INSUFICIENTE'})).percentual,null);
 assert.equal(apresentarEstadoOrcamento(summary(80),true).percentual,null);assert.equal(apresentarEstadoOrcamento(summary(80),false,true).percentual,null);
 assert.equal(apresentarResumoFinanceiro(summary(0,{qualidade:'SEM_COMPRAS'})).titulo,'Sem compras confirmadas');assert.doesNotMatch(source,/M\?s|or\?amento|l\?quido/);
});
const homeUtil=await readFile(new URL('src/utils/resumoHome.js',base),'utf8');
const {financeiroHome}=await import('data:text/javascript;base64,'+Buffer.from(homeUtil).toString('base64'));
const component=await readFile(new URL('src/components/HomeComponents/ResumoInterativo/index.js',base),'utf8');
const React={createElement:(type,props,...children)=>typeof type==='function'?type(props):({type,props:props||{},children})};
const code=transformSync(component.replace(/^import .*;\r?\n/gm,'').replace('export default function','function'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx']}).code;
let localState=[], hookIndex=0;
test.beforeEach(()=>{localState=[];hookIndex=0;});
const useState=initial=>{const index=hookIndex++;if(localState[index]===undefined)localState[index]=initial;return[localState[index],next=>{localState[index]=typeof next==='function'?next(localState[index]):next;}];};
const gaugeUtil=await readFile(new URL('src/utils/meiaLuaHome.js',base),'utf8');
const {apresentarMeiaLua}=await import('data:text/javascript;base64,'+Buffer.from(gaugeUtil).toString('base64'));
const cardSource=await readFile(new URL('src/components/HomeComponents/CardFinanceiroHome.js',base),'utf8');
const cardCode=transformSync(cardSource.replace(/^import .*;\r?\n/gm,'').replace('export default function','function'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx']}).code;
const CardFinanceiroHome=new Function('React','View','Text','Pressable','ActivityIndicator','StyleSheet','Svg','Path','MaterialCommunityIcons','useState','apresentarMeiaLua',cardCode+';return CardFinanceiroHome;')(React,'View','Text','Pressable','Spinner',{create:x=>x},'Svg','Path','Icon',useState,apresentarMeiaLua);
const HomeRender=new Function('React','View','Text','Pressable','ActivityIndicator','styles','MaterialCommunityIcons','useState','apresentarResumoFinanceiro','apresentarEstadoOrcamento','resumirTempoHoje','formatarTempoUso','financeiroHome','CardFinanceiroHome',`${code};return ResumoInterativo;`)(React,'View','Text','Pressable','Spinner',{},'Icon',useState,apresentarResumoFinanceiro,apresentarEstadoOrcamento,()=>0,()=> '--',financeiroHome,CardFinanceiroHome);
const Home=props=>{hookIndex=0;return HomeRender(props);};
const text=t=>t==null||t===false?'':Array.isArray(t)?t.map(text).join(' '):typeof t==='object'?text(t.children):String(t);
const nodes=t=>t==null||t===false?[]:Array.isArray(t)?t.flatMap(nodes):typeof t==='object'?[t,...nodes(t.children)]:[];
const homeData=(extra={})=>({financeiro:{comprasConfirmadas:3,comprasComValor:3,comprasSemValor:0,totalCentavos:23000,totalConhecidoCentavos:23000,qualidade:'COMPLETO',cobertura:'DESCONHECIDA'},orcamento:{valorCentavos:20000,percentualConhecido:115,disponibilidade:'REFERENCIA_ATUAL'},...extra});
const props={selecionado:'gastos',perspectiva:'compras',tempo:{estado:'SEM_CONSENTIMENTO',registros:[]},dados:homeData()};
test('three selectors always visible and tap updates indicator without horizontal carousel',()=>{
 const selected=[];const tree=Home({...props,onSelect:x=>selected.push(x)});assert.match(text(tree),/Gastos/);assert.match(text(tree),/Orçamento/);assert.match(text(tree),/Tempo em Aplicativos/);assert.doesNotMatch(component,/ScrollView|horizontal/);
 const buttons=nodes(tree).filter(n=>n.props.accessibilityState);buttons[1].props.onPress();assert.deepEqual(selected,['meta']);
});
test('separate error loading no purchases and unauthorized Android states',()=>{
 assert.match(text(Home({...props,loading:true})),/Resumo do mês/);assert.ok(nodes(Home({...props,loading:true})).some(n=>n.type==='Spinner'));
 assert.match(text(Home({...props,error:true})),/Erro ao carregar/);
 const empty=homeData({financeiro:{...props.dados.financeiro,totalCentavos:0,totalConhecidoCentavos:0,qualidade:'SEM_COMPRAS',comprasConfirmadas:0}});
 assert.match(text(Home({...props,dados:empty})),/Sem compras confirmadas/);assert.match(text(Home({...props,selecionado:'tempo'})),/Monitoramento não autorizado/);
});
test('detail navigation emits selected context and never exposes purchase descriptions',()=>{
 const calls=[];const tree=Home({...props,onDetalhes:x=>calls.push(x)});const link=nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Ver detalhes'));link.props.onPress();assert.deepEqual(calls,['gastos']);assert.doesNotMatch(component,/compra_item_nome|usuario_nome|compra_usuario_anotacao/);
});
test('Dashboard retains horizontal presentation and shared budget helper; Home uses only safe summary',async()=>{
 const dashboard=await readFile(new URL('src/components/DashboardComponents/GastosGerais/index.js',base),'utf8');assert.match(dashboard,/ScrollView horizontal/);assert.match(dashboard,/apresentarEstadoOrcamento/);
 const home=await readFile(new URL('src/pages/HomeScreen/index.js',base),'utf8');assert.doesNotMatch(home,/useAnaliseComportamento|fetchCompras|AlertasHabito/);assert.match(home,/useResumoHome/);assert.match(home,/MetasHome/);assert.match(home,/CardFinanceiroHome/);assert.doesNotMatch(home,/navigate\('Dashboard', \{ periodo/);
 const screen=await readFile(new URL('src/pages/DashboardScreen/index.js',base),'utf8');assert.match(screen,/incomingPeriod/);assert.match(screen,/scrollTo/);assert.match(screen,/onLayout=\{mark\('tempo'\)\}/);
});
test('time hook never reads usage without consent; errors remain explicit',async()=>{
 const s=await readFile(new URL('src/hooks/useTempoUsoHome.js',base),'utf8');const code=s.replace(/^import .*;\r?\n/gm,'').replace('export function','function');
 for(const active of [false,true]){let state;const calls=[];const h=new Function('useCallback','useRef','useState','useFocusEffect','apiClient','tokenStorage',`${code};return useTempoUsoHome(true);`)(fn=>fn,()=>({current:0}),initial=>{state=initial;return[initial,s=>{state=s;}];},()=>{}, {get:async path=>{calls.push(path);if(path==='/consentimento')return{data:[{consentimento_tipo_codigo:'MONITORAMENTO_TEMPO_USO',consentimento_status:active}]};throw Error('offline');}},{captureSession:async()=>({id:1,signal:new AbortController().signal}),assertSession:()=>{}});
 await h.refresh();assert.equal(state.estado,active?'ERRO':'SEM_CONSENTIMENTO');assert.equal(calls.includes('/tempo-uso'),active);}
});

test('private perspectives and recommendations unavailable without leaking evidence',()=>{
 const tree=Home({...props,perspectiva:'orientacoes'});
 assert.match(text(tree),/Suas metas/);assert.match(text(tree),/Análises no Dashboard/);
 assert.doesNotMatch(component,/dados\.analise|dados\.recomendacoes|referencias|categoriaId/);
 assert.match(text(Home({...props,perspectiva:'categorias'})),/preservar sua privacidade/);
});
test('historic budget and unknown total stay absent',()=>{
 const data=homeData({financeiro:{...props.dados.financeiro,totalCentavos:null,qualidade:'INSUFICIENTE',comprasSemValor:3},orcamento:{valorCentavos:null,percentualConhecido:null,disponibilidade:'INDISPONIVEL'}});
 const tree=Home({...props,dados:data});assert.match(text(tree),/Valor não informado/);assert.doesNotMatch(text(tree),/% do orçamento/);
});
test('clear surfaces and comfortable targets; Dashboard widths bounded without fixed height',async()=>{
 const homeStyles=await readFile(new URL('src/components/HomeComponents/ResumoInterativo/styles.js',base),'utf8');assert.match(homeStyles,/backgroundColor: '#FFFFFF'/);assert.match(homeStyles,/minHeight: 48/);
 const dashboard=await readFile(new URL('src/components/DashboardComponents/GastosGerais/index.js',base),'utf8');assert.match(dashboard,/width: cardWidth/);assert.match(dashboard,/useWindowDimensions/);assert.match(dashboard,/ScrollView horizontal/);
});

test('Home next steps reuse existing navigation without reading private purchases or inventing progress',()=>{
 const calls=[];const tree=Home({...props,onMetas:()=>calls.push('goals'),onDetalhes:x=>calls.push(x)});
 nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Ver metas')).props.onPress();
 nodes(tree).find(n=>n.type==='Pressable'&&text(n).includes('Abrir Dashboard')).props.onPress();
 assert.deepEqual(calls,['goals','orientacoes']);assert.doesNotMatch(component,/apiClient|fetchMetas|meta_acumulado|dados\.analise|categoriaId|compra_id/);
});
