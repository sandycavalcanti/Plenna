import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {interpretarSinais} from '../src/components/PurchaseComponents/AnaliseCompra/sinaisDecisao.js';
import {mensagemErroAnalytics,diagnosticoAnalytics} from '../src/utils/erroAnalytics.js';
import {apresentarContextoHistorico,apresentarAvaliacaoHistorica} from '../src/components/PurchaseComponents/RegistrosContextuais/apresentacao.js';
import {gruposContexto,reflexaoPeriodo} from '../src/components/PurchaseComponents/PanoramaCompras/apresentacao.js';
import {createRenderer} from './helpers/componentRenderer.mjs';
const c=(values)=>({estado:'VALIDO',principal:{id:'compositor-contextual-1:4:TESTE',evidencias:Object.entries(values).map(([campo,valor])=>({id:campo,campo,valor}))},complementares:[]});
test('sinais exigem combinações verificadas do principal; fatores isolados e necessidade legítima são neutros',()=>{
  for(const v of [{influenciaPromocional:'SIM'},{momento:'ANTECIPADA'},{financeiro:'LIMITE_EXCEDIDO'},{planejamento:'NAO',necessidadeInesperada:'SIM'},{autopercepcaoImpulsividade:'SIM'}])assert.equal(interpretarSinais(c(v)).estado,'LIMITADAS');
  for(const v of [{influenciaPromocional:'SIM',momento:'ANTECIPADA'},{planejamento:'PARCIALMENTE',planejamentoItem:'NAO'},{autopercepcaoImpulsividade:'SIM',planejamento:'SIM'}])assert.equal(interpretarSinais(c(v)).estado,'OBSERVADOS');
  assert.equal(interpretarSinais(c({planejamento:'SIM',influenciaPromocional:'NAO'})).estado,'NAO_IDENTIFICADOS');
  assert.equal(interpretarSinais({...c({planejamento:'SIM'}),estado:'DESATUALIZADO'}).estado,'DESATUALIZADA');
  assert.equal(interpretarSinais(null).estado,'LIMITADAS');
  assert.equal(interpretarSinais({...c({}),complementares:[c({influenciaPromocional:'SIM',momento:'ANTECIPADA'}).principal]}).estado,'LIMITADAS');
});
test('HTTP 400 não é conexão e diagnóstico sanitizado não inclui dados ou mensagens do servidor',()=>{
  const e={response:{status:400,data:{message:'Dados inválidos',errors:[{field:'month',message:'segredo'},{field:'nome do usuário'}]}},config:{headers:{Authorization:'Bearer segredo'}}};
  assert.doesNotMatch(mensagemErroAnalytics(e),/conexão/);assert.match(mensagemErroAnalytics(e),/não foi aceito/);
  const diag=diagnosticoAnalytics(e,{mode:'month',month:'2026-10'});assert.deepEqual(diag.campos,['month']);assert.equal(diag.mes,'2026-10');assert.doesNotMatch(JSON.stringify(diag),/segredo|Bearer|usuário/);
  assert.match(mensagemErroAnalytics({response:{status:500}}),/indisponíveis/);assert.match(mensagemErroAnalytics({response:{status:401}}),/sessão/);
});
test('navegação outubro/dezembro descarta 400 atrasado e aceita mês vazio ao retornar',async()=>{
  const source=readFileSync(new URL('../src/pages/DashboardScreen/index.js',import.meta.url),'utf8');
  const code=source.slice(source.indexOf('  const loadOverview ='),source.indexOf('  const loadComparison ='));
  const refs={overviewRequestRef:{current:0},overviewAbortRef:{current:null}},state={},pending=[];
  const mocks={...refs,useCallback:fn=>fn,AbortController,isCanceled:e=>e.code==='ERR_CANCELED',logApiErrors(){},mensagemErroAnalytics,diagnosticoAnalytics,
    setOverviewLoading:v=>state.loading=v,setOverviewError:v=>state.error=v,setOverviewData:v=>state.data=v,
    getDashboardAnalytics:(params,options)=>new Promise((resolve,reject)=>pending.push({params,options,resolve,reject}))};
  const load=mes=>new Function(...Object.keys(mocks),'selectedMonth',code+';return loadOverview;')(...Object.values(mocks),mes)();
  const october=load('2026-10'),december=load('2026-12');assert.equal(pending[0].options.signal.aborted,true);
  pending[1].resolve({periodos:[{periodo:'2026-12',quantidade_compras:0}]});await december;
  pending[0].reject({response:{status:400,data:{message:'Dados inválidos'}}});await october;assert.equal(state.error,null);assert.equal(state.data.periodos[0].periodo,'2026-12');
  const failed=load('2026-10');pending[2].reject({response:{status:400,data:{errors:[{field:'month'}]}}});await failed;assert.match(state.error,/não foi aceito/);assert.equal(state.data,null);
  const back=load('2026-10');pending[3].resolve({periodos:[{periodo:'2026-10',quantidade_compras:0}]});await back;assert.equal(state.data.periodos[0].quantidade_compras,0);assert.equal(state.error,null);assert.equal(pending.length,4);
});
test('contexto histórico sem snapshot usa rótulo neutro; avaliação usa nome persistido e não nome atual',()=>{
  const row={revisao:1,respostas:{},itens:[{itemId:160,planejamento:'NAO'}]};assert.equal(apresentarContextoHistorico(row).items[0].label,'Item registrado');
  const base={interpretacao:{reflexao:null,referencias:[],mensagem:''},regrasAplicadas:[],declaracoes:[{campo:'planejamentoItem',itemId:160,mensagem:'Café antigo: planejamento declarado como não planejado.',valor:'NAO',referencias:[],codigo:'R3_ITEM'}],observacoes:[]};
  assert.equal(apresentarAvaliacaoHistorica(base).outras[0].label,'Café antigo');base.declaracoes[0].mensagem='Sem nome';assert.equal(apresentarAvaliacaoHistorica(base).outras[0].label,'Item registrado');
});
test('panorama agrupa famílias e reflexão não repete estatística como conclusão psicológica',()=>{
  const sinais=[{codigo:'PLANEJADA',validos:3,condicao:1},{codigo:'PARCIAL',validos:3,condicao:2},{codigo:'NAO_PLANEJADA',validos:3,condicao:0},{codigo:'IMPULSO',validos:1,condicao:1}];
  assert.equal(gruposContexto(sinais).length,2);assert.equal(gruposContexto(sinais)[0].codigo,'PARCIAL');
  const d={universo:4,comContexto:2,relacoes:[{condicao:2}],habitos:{categorias:[]}};assert.match(reflexaoPeriodo(d),/O que ajudaria/);assert.doesNotMatch(reflexaoPeriodo(d),/2 de|compulsiv|diagnóstico/);
});
const text=n=>typeof n==='string'?n:n?.props?.children?.map(text).join('')||'';
test('concordância é persistida no ledger, revisável, vinculada à avaliação e protegida por sessão',async()=>{
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/contextualRefinamento.json',import.meta.url),'utf8'));
  let envelope={versaoContrato:1,compraId:1,atualidade:'VIGENTE',avaliacaoId:4,criadaEm:'2026-10-30T12:00:00Z',motivos:[],resultado:fixture};
  const abort=new AbortController(),calls=[],writes=[];
  let saved=0;
  const h=createRenderer({'../../../api/client':{apiClient:{get:async u=>{calls.push(u);return {data:envelope};},post:async(u,b)=>{writes.push({u,b});return {data:{versaoContrato:1,compraId:1,persistido:true,evento:{id:writes.length,operacaoId:b.operacaoId,revisao:b.revisaoEsperada+1,tipo:b.tipo,itemId:null,dataEfetiva:null,corrigeEventoId:null,anulado:false,dados:b}}};}}},'../../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:1,signal:abort.signal}),assertSession:()=>{if(abort.signal.aborted)throw Error('SESSION');}}}});
  h.mount(h.load('src/components/PurchaseComponents/AnaliseCompra/RespostaAnalise.js').default,{compraId:1,avaliacao:envelope,sinais:{id:'interpretacao-fixture-4',versao:'sinais-contextuais-1',estado:'OBSERVADOS'},revisaoEventos:0,onSaved:()=>saved++});await h.flush();
  const radios=()=>h.nodes(n=>n.props.accessibilityRole==='radio');assert.equal(radios().length,3);assert.ok(radios().every(n=>!n.props.accessibilityState.selected));
  for(const index of [0,1,2,0]){radios()[index].props.onPress();await h.flush();assert.equal(radios().filter(n=>n.props.accessibilityState.selected).length,1);}
  assert.equal(calls.length,0);assert.equal(writes.length,4);assert.equal(saved,4);assert.ok(writes.every(w=>w.u==='/v2/compras/1/eventos'&&w.b.avaliacaoId===4));
  assert.equal(writes[0].b.confirmarImpulsiva,true);assert.equal(writes[1].b.confirmarImpulsiva,false);assert.match(h.nodes(n=>n.type==='Text').map(text).join(' '),/Resposta salva no histórico/);
  envelope={...envelope,avaliacaoId:5};h.update({avaliacao:envelope,sinais:{id:'interpretacao-fixture-5',versao:'sinais-contextuais-1',estado:'OBSERVADOS'}});await h.flush();assert.ok(radios().every(n=>!n.props.accessibilityState.selected));
  const before=writes.length;abort.abort();radios()[0].props.onPress();await h.flush();assert.equal(writes.length,before);assert.equal(saved,4);h.unmount();
});
