import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {apresentarAvaliacao,apresentarReferenciaComplementar,separarReflexao} from '../src/components/PurchaseComponents/AnaliseCompra/apresentacao.js';
import {createRenderer} from './helpers/componentRenderer.mjs';
const fixture=name=>JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url),'utf8'));
const envelope=(extra={})=>({versaoContrato:1,compraId:1,atualidade:'VIGENTE',avaliacaoId:4,criadaEm:'2026-10-30T12:00:00Z',motivos:[],resultado:fixture('contextualRefinamento'),...extra});
const text=n=>typeof n==='string'||typeof n==='number'?String(n):n?.props?.children?.map(text).join('')||'';

test('apresentação usa apenas resultado registrado, referências e regras; agrupa itens sem mutação',()=>{
  const data=envelope(),before=structuredClone(data),view=apresentarAvaliacao(data,1);
  assert.match(view.resultado,/compra não estava planejada/);
  assert.equal(view.pergunta,'A oferta antecipou uma necessidade ou despertou uma vontade nova?');
  assert.equal(view.fatores.filter(f=>f.codigo==='ITENS').length,1);
  assert.equal(view.fatores.find(f=>f.codigo==='ITENS').valorCurto,'1 planejado · 1 não planejado');
  assert.equal(view.declaracoes.find(d=>d.itemId===10).titulo,'Alimentacao ficticia');
  assert.deepEqual(data,before);
  data.resultado.interpretacao.referencias=[];
  assert.deepEqual(apresentarAvaliacao(data,1).fatores,[]);
  data.resultado.interpretacao.referencias=before.resultado.interpretacao.referencias;
  data.resultado.regrasAplicadas=[];
  assert.deepEqual(apresentarAvaliacao(data,1).fatores,[]);
});

test('incerteza, recusa, autopercepção e oito regras mantêm proveniência sem fabricar fatores',()=>{
  const data=envelope({resultado:fixture('contextualIncerto')});
  let view=apresentarAvaliacao(data,1);
  assert.equal(view.fatores.length,0);assert.equal(view.pergunta,null);
  assert.equal(view.declaracoes[0].valorCurto,'Não lembro');
  assert.equal(view.declaracoes[1].valorCurto,'Prefiro não responder');
  const valid=envelope();
  const ref='contexto:1:revisao:1:autopercepcaoImpulsividade';
  valid.resultado.autopercepcao={codigo:'R8_AUTOPERCEPCAO',campo:'autopercepcaoImpulsividade',valor:'SIM',mensagem:'Percebi impulso.',referencias:[ref]};
  valid.resultado.regrasAplicadas.push({codigo:'R8_AUTOPERCEPCAO',versao:1,justificativa:'Declaração',referencias:[ref]},
    {codigo:'R1_LIMITE',versao:1,justificativa:'Comparação atual',referencias:['perfil:limite-atual']});
  view=apresentarAvaliacao(valid,1);
  assert.equal(view.rastreio.regras.length,9); // R3 ocorre uma vez por item.
  assert.equal(view.declaracoes.at(-1).valorCurto,'Percebeu impulso');
  assert.equal(view.fatores.some(f=>f.codigo==='R8_AUTOPERCEPCAO'),false);
  assert.equal(new Set(view.rastreio.regras.map(r=>r.codigo)).size,8);
});

test('estado ausente, desatualizado e revisão divergente nunca mostram reflexão vigente',()=>{
  for(const data of [null,envelope({atualidade:'DESATUALIZADA'}),envelope({resultado:{...fixture('contextualRefinamento'),contextoRevisao:0}})]) {
    const view=apresentarAvaliacao(data,1);assert.equal(view.resultado,null);assert.equal(view.pergunta,null);assert.deepEqual(view.fatores,[]);
  }
  assert.deepEqual(separarReflexao('Uma afirmação sem pergunta.'),{resultado:'Uma afirmação sem pergunta.',pergunta:null});
  assert.deepEqual(separarReflexao('O que mudou?'),{resultado:null,pergunta:'O que mudou?'});
});

test('comparação complementar exige centavos válidos e comprovação temporal independente',()=>{
  const d={versaoContrato:1,compraId:1,disponivel:true,compraCentavos:58456,limiteAtualCentavos:50000,limiteHistoricoCentavos:60000,historicoComprovado:false};
  assert.deepEqual(apresentarReferenciaComplementar(d,1),{compra:58456,atual:{valor:50000,diferenca:8456},historica:null});
  assert.equal(apresentarReferenciaComplementar({...d,historicoComprovado:true},1).historica.diferenca,-1544);
  assert.equal(apresentarReferenciaComplementar({...d,compraCentavos:NaN},1),null);
  assert.equal(apresentarReferenciaComplementar({...d,compraId:2},1),null);
  assert.equal(apresentarReferenciaComplementar({...d,limiteAtualCentavos:0},1).atual,null);
});

function screen(initial=envelope(),referencias={versaoContrato:1,compraId:1,disponivel:true,compraCentavos:58456,limiteAtualCentavos:50000,historicoComprovado:false},props={}) {
  let data=initial,listener;
  const controller=new AbortController(),calls=[],posts=[];
  const history=fixture('historicoCompra');
  const h=createRenderer({
    '../../api/client':{apiClient:{get:async(url)=>{calls.push(url);return {data:{versaoContrato:1,compraId:1,eventos:[],proximaAntes:null}};}}},
    '../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:1,signal:controller.signal}),assertSession:()=>{if(controller.signal.aborted)throw Error('SESSION');}}},
    'react-native':{View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',ActivityIndicator:'ActivityIndicator',StyleSheet:{create:v=>v,absoluteFillObject:{position:'absolute'}},AppState:{addEventListener:(_type,fn)=>{listener=fn;return {remove(){}};}}},
    '../../../api/client':{apiClient:{
      get:async url=>{calls.push(url);if(url.endsWith('/avaliacoes/atual'))return {data};if(url.endsWith('/referencias'))return {data:referencias};if(url.endsWith('/indicadores-historicos'))return {data:history};throw Error('UNAVAILABLE');},
      post:async(url,body)=>{posts.push({url,body});data=envelope({avaliacaoId:5});return {data};},
    }},
    '../../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:1,signal:controller.signal}),assertSession:()=>{if(controller.signal.aborted)throw Error('SESSION');}}},
  });
  h.mount(h.load('src/components/PurchaseComponents/AnaliseCompra/index.js').default,{compraId:1,revisao:1,...props});
  const press=label=>{const n=h.nodes(n=>n.type==='Pressable'&&(n.props.accessibilityLabel===label||text(n)===label))[0];assert.ok(n,label);assert.ok(!n.props.disabled);n.props.onPress();};
  return {h,calls,posts,press,controller,background:()=>listener('background'),data:()=>data};
}

test('fontes automática e contextual independentes, pergunta única e painel sem novas consultas',async()=>{
  const s=screen();await s.h.flush();
  const displayed=()=>s.h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.equal(s.calls.length,2);assert.equal(s.posts.length,0);
  assert.match(displayed(), /Análise do Plenna/);assert.match(displayed(), /Fatores relacionados/);
  assert.doesNotMatch(displayed(), /Interpretação das suas declarações/);
  const pergunta='Como o planejamento desses itens se encaixou numa compra que não estava nos planos?';
  assert.equal(displayed().split(pergunta).length-1,1);
  s.press('Entender esta análise');await s.h.flush();
  assert.equal(s.h.nodes(n=>n.type==='Modal').length,0);
  for(const title of ['Como o Plenna interpretou','Por que isso apareceu','Sobre esta interpretação'])assert.match(displayed(),new RegExp(title));
  assert.equal(displayed().split(pergunta).length-1,1);
  assert.doesNotMatch(displayed(),/Ver origem do resultado|R7_CONTEXTO|584,56|84,56/);
  assert.equal(s.calls.length,2);assert.equal(s.posts.length,0);
  s.press('Fechar Entender esta análise');await s.h.flush();assert.doesNotMatch(displayed(),/Evidências utilizadas/);
  s.h.unmount();
});

test('avaliação desatualizada atualiza apenas por ação explícita e preserva revisão esperada',async()=>{
  const s=screen(envelope({atualidade:'DESATUALIZADA'}));await s.h.flush();
  assert.equal(s.posts.length,0);assert.equal(s.h.nodes(n=>n.type==='Text'&&text(n)==='Para refletir').length,0);
  s.press('Atualizar reflexão');await s.h.flush();
  assert.deepEqual(s.posts,[{url:'/v2/compras/1/avaliacoes',body:{revisaoEsperada:1}}]);
  assert.equal(s.data().avaliacaoId,5);assert.ok(s.h.nodes(n=>n.type==='Text'&&text(n)==='Para refletir').length);
  s.h.unmount();
});

test('sem avaliação oferece geração opcional; sessão revogada remove resultado e painel',async()=>{
  const s=screen(envelope({atualidade:'SEM_AVALIACAO',resultado:null,avaliacaoId:null,criadaEm:null}));await s.h.flush();
  assert.equal(s.posts.length,0);s.press('Gerar reflexão opcional');await s.h.flush();
  s.press('Entender esta análise');await s.h.flush();s.controller.abort();await s.h.flush();
  const displayed=s.h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed,/Sua sessão mudou/);assert.doesNotMatch(displayed,/compra não estava nos seus planos|Evidências utilizadas/);
  s.h.unmount();
});

test('fluxo integrado gera avaliação inicial uma vez, sem reavaliar histórico nem alterar classificação',async()=>{
  const s=screen(envelope({atualidade:'SEM_AVALIACAO',resultado:null,avaliacaoId:null,criadaEm:null}),null,{gerarInicialAutomaticamente:true});await s.h.flush();
  assert.equal(s.posts.length,1);assert.equal(s.posts[0].url,'/v2/compras/1/avaliacoes');assert.deepEqual(s.posts[0].body,{revisaoEsperada:1});
  s.h.update({refreshKey:1});await s.h.flush();assert.equal(s.posts.length,1);s.h.unmount();
  const stale=screen(envelope({atualidade:'DESATUALIZADA'}),null,{gerarInicialAutomaticamente:true});await stale.h.flush();assert.equal(stale.posts.length,0);stale.h.unmount();
  const hidden=screen(envelope({atualidade:'SEM_AVALIACAO',resultado:null,avaliacaoId:null,criadaEm:null}),null,{gerarInicialAutomaticamente:true,restricaoInsight:'COMPRA_OCULTA'});await hidden.h.flush();assert.equal(hidden.posts.length,0);hidden.h.unmount();
});

test('background fecha painel e limpa o resultado financeiro e contextual',async()=>{
  const s=screen();await s.h.flush();s.press('Entender esta análise');await s.h.flush();s.background();await s.h.flush();
  assert.equal(s.h.nodes(n=>n.type==='Text'&&text(n)==='Evidências utilizadas').length,0);
  assert.equal(s.h.nodes(n=>n.type==='Text'&&/584,56/.test(text(n))).length,0);s.h.unmount();
});

test('sem dados financeiros atuais preserva comparação registrada sem inventar valores',async()=>{
  const d=envelope();
  d.resultado.declaracoes=d.resultado.declaracoes.filter(item=>item.campo==='planejamento');
  d.resultado.evidencias.push({referencia:'perfil:limite-atual',natureza:'DECLARADO'});
  d.resultado.observacoes.push({codigo:'LIMITE_EXCEDIDO',mensagem:'O valor registrado supera a referência individual atual em R$ 20,00. Isso não determina impulsividade.',referencias:['compra:1','perfil:limite-atual']});
  d.resultado.regrasAplicadas.push({codigo:'R1_LIMITE',versao:1,justificativa:'Comparação atual no momento da avaliação.',referencias:['compra:1','perfil:limite-atual']});
  const before=structuredClone(d),s=screen(d,null);await s.h.flush();
  assert.equal(apresentarAvaliacao(d,1).fatores.some(f=>f.codigo==='LIMITE_EXCEDIDO'),false);
  s.press('Entender esta análise');await s.h.flush();
  const displayed=s.h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed,/Comparação financeira/);assert.match(displayed,/20,00/);assert.match(displayed,/não comprova um limite vigente/);assert.equal(s.calls.length,2);
  assert.doesNotMatch(displayed,/584,56|84,56/);assert.deepEqual(d,before);assert.equal(s.posts.length,0);
  s.h.unmount();
});

test('três fatores do insight derivado e mudanças de validade não reutilizam evidência removida',async()=>{
  const d=envelope();
  d.resultado.declaracoes.find(e=>e.campo==='planejamento').valor='PARCIALMENTE';
  const before=structuredClone(d),s=screen(d);await s.h.flush();
  const displayed=()=>s.h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed(),/Sinais contextuais relacionados/);
  assert.match(displayed(),/Você teria comprado agora se a oferta não existisse/);
  assert.equal(s.posts.length,0);assert.deepEqual(d,before);
  s.press('Entender esta análise');await s.h.flush();
  s.h.update({compraId:1,revisao:1,restricaoInsight:'CANCELAMENTO_REGISTRADO'});await s.h.flush();
  assert.doesNotMatch(displayed(),/Planos, oferta e momento|Você teria comprado agora|Evidências utilizadas/);
  s.h.update({compraId:1,revisao:1,restricaoInsight:undefined,itensPermitidos:[]});await s.h.flush();
  assert.match(displayed(),/Sinais contextuais relacionados/);
  s.h.update({compraId:1,revisao:2});await s.h.flush();
  assert.doesNotMatch(displayed(),/Planos, oferta e momento|Você teria comprado agora/);
  assert.match(displayed(),/desatualizada/);assert.equal(s.posts.length,0);
  s.h.unmount();
});

test('sem avaliação mostra dado objetivo e consulta automática; background, sessão e proteção o removem',async()=>{
  const initial=envelope({atualidade:'SEM_AVALIACAO',resultado:null,avaliacaoId:null,criadaEm:null});
  const props={compra:{compra_id:1,compra_status:'CONFIRMADA',compra_ativo:1,compra_valor:125.5,tb_compra_item:[{compra_item_id:10}]},itensPermitidos:[10]};
  for(const modo of ['background','session','protected']) {
    const s=screen(initial,null,props);await s.h.flush();
    const displayed=()=>s.h.nodes(n=>n.type==='Text').map(text).join(' ');
    assert.match(displayed(),/Sobre este registro/);assert.match(displayed(),/125,50/);
    assert.equal(s.calls.length,2);assert.equal(s.posts.length,0);
    if(modo==='background')s.background();
    if(modo==='session')s.controller.abort();
    if(modo==='protected')s.h.update({compraId:1,revisao:1,...props,restricaoInsight:'COMPRA_OCULTA'});
    await s.h.flush();assert.doesNotMatch(displayed(),/125,50|Sobre este registro/);
    s.h.unmount();
  }
});

test('analysis has no history navigation and uses one compact footer with actual dates',async()=>{
 const s=screen(envelope(),null,{eventos:[{tipo:'CLASSIFICACAO',revisao:1,registradaEm:'2026-11-07T11:37:25Z'}]});await s.h.flush();
 const displayed=s.h.nodes(n=>n.type==='Text').map(text).join(' ');
 assert.doesNotMatch(displayed,/Hist\u00f3rico de|Outros registros|Avalia\u00e7\u00e3o registrada em|Dados consultados em/);
 assert.match(displayed,/\u00daltimas atualiza\u00e7\u00f5es/);
 assert.match(displayed,/An\u00e1lise: 30\/10\/2026, \u00e0s 09h/);
 assert.match(displayed,/Classifica\u00e7\u00e3o: 07\/11\/2026, \u00e0s 08h37/);
 assert.doesNotMatch(displayed,/08:37:25/);
 assert.equal(s.calls.filter(u=>u.endsWith('/eventos/historico')).length,0);s.h.unmount();
});

test('missing or invalid timestamps never manufacture update lines',async()=>{
 for(const value of [null,'invalid','']){
  const s=screen(envelope({criadaEm:value}),null,{eventos:[{tipo:'CLASSIFICACAO',revisao:2,registradaEm:value}]});await s.h.flush();
  const displayed=s.h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.doesNotMatch(displayed,/\u00daltimas atualiza\u00e7\u00f5es|An\u00e1lise:|Classifica\u00e7\u00e3o:|Invalid Date/);s.h.unmount();
 }
});

test('limited information never offers agreement as an impulsivity suggestion',async()=>{
 const s=screen(envelope(),null,{revisaoEventos:0});await s.h.flush();
 assert.equal(s.h.nodes(n=>n.type==='Text'&&text(n)==='Voc\u00ea concorda com essa interpreta\u00e7\u00e3o?').length,0);s.h.unmount();
});
