import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {criarConsultaPanorama,parametrosPanorama,validarPanorama} from '../src/services/panoramaComprasService.js';
import {createRenderer} from './helpers/componentRenderer.mjs';

const filtros={modo:'MES',mes:'2026-10',inicio:'',fim:'',status:'TODOS',busca:''};
const fixture=(detalhes=false,mes='2026-10',comportamento=false)=>{
  const periodo={modo:'MES',mes,inicio:`${mes}-01T03:00:00.000Z`,fimExclusivo:mes==='2026-10'?'2026-11-01T03:00:00.000Z':'2026-10-01T03:00:00.000Z',observadoAte:mes==='2026-10'?'2026-11-01T03:00:00.000Z':'2026-10-01T03:00:00.000Z',timezone:'America/Sao_Paulo'};
  const indicador=(codigo,condicao,validos=2)=>({codigo,condicao,validos,universo:3,proporcao:validos?condicao/validos:null,disponibilidade:validos?'DISPONIVEL':'SEM_DADOS',origem:codigo==='PROMOCAO_ANTECIPACAO'?'RESPOSTAS_NA_MESMA_COMPRA':'RESPOSTA_VOLUNTARIA',periodo});
  return {versaoContrato:1,periodo,universo:3,comContexto:2,comAutopercepcao:1,disponibilidade:'DISPONIVEL',reflexao:'Promoções foram declaradas em 1 de 2 compras com resposta conhecida.',limitacoes:['Associação não comprova causa.'],
    ...(detalhes?{sinais:[indicador('PROMOCAO',1)],relacoes:[indicador('PROMOCAO_ANTECIPACAO',1,1)],habitos:{origem:'COMPRAS_REGISTRADAS',categorias:[{nome:'Outros',compras:2}],categoriasValidas:2,diasSemana:[{dia:1,compras:3}],valoresValidos:2,totalCentavos:5000,comparacao:{disponibilidade:'INDISPONIVEL'}}}:{}),
    ...(comportamento?{comportamento:JSON.parse(readFileSync(new URL('./fixtures/panoramaComportamento.json',import.meta.url),'utf8'))}:{})};
};
const tick=()=>new Promise(r=>setImmediate(r));
function service(get=async(_url,o)=>({data:fixture(o.params.detalhes==='1')})) {
  const abort=new AbortController(),states=[],calls=[];
  const q=criarConsultaPanorama({filtros,client:{get:(...args)=>{calls.push(args);return get(...args);}},
    storage:{captureSession:async()=>({id:7,signal:abort.signal}),assertSession:()=>{if(abort.signal.aborted)throw Error('SESSION_REQUIRED');}},onChange:s=>states.push(s)});
  return {q,abort,states,calls};
}
test('mês, intervalo e todo histórico usam os filtros da lista, sem piso artificial ou paginação',()=>{
  assert.deepEqual(parametrosPanorama(filtros),{mes:'2026-10'});
  assert.deepEqual(parametrosPanorama({...filtros,modo:'INTERVALO',inicio:'01/09/2026',fim:'06/11/2026'}),{inicio:'2026-09-01',fim:'2026-11-06'});
  assert.deepEqual(parametrosPanorama({...filtros,modo:'TODOS'}),{});
});
test('valida contrato, período, contagens e denominadores antes de mostrar dados',()=>{
  assert.equal(validarPanorama(fixture(true),{mes:'2026-10'},true).universo,3);
  for(const mutate of [d=>d.periodo.mes='2026-09',d=>d.comContexto=4,d=>d.comAutopercepcao=3,d=>d.sinais[0].validos=4,
    d=>d.sinais[0].proporcao=0.9,d=>d.sinais[0].condicao=3,d=>d.sinais[0].origem='AUTOMATICA',d=>d.habitos.diasSemana[0].compras=4,
    d=>d.habitos.categorias[0].compras=3,d=>d.relacoes.push(d.relacoes[0])]) {
    const d=fixture(true);mutate(d);assert.throws(()=>validarPanorama(d,{mes:'2026-10'},true));
  }
});
test('resumo carrega uma vez, detalhes sob demanda, sem escrita ou carregamento da lista',async()=>{
  const s=service();await s.q.consultar();assert.equal(s.calls.length,1);assert.equal(s.calls[0][0],'/analises/panorama');
  assert.deepEqual(s.calls[0][1].params,{mes:'2026-10',detalhes:'0'});assert.equal(s.calls[0][1].usageMonitoringSessionId,7);
  await s.q.consultar(true);assert.equal(s.calls.length,2);assert.equal(s.calls[1][1].params.detalhes,'1');assert.equal(s.states.at(-1).status,'ready');s.q.dispose();
});
test('respostas atrasadas, dispose e sessão revogada não repõem dados',async()=>{
  const pending=[];const s=service(()=>new Promise(r=>pending.push(r)));
  const a=s.q.consultar();await tick();const b=s.q.consultar(true);await tick();
  pending[1]({data:fixture(true)});await b;assert.equal(s.states.at(-1).dados.habitos.origem,'COMPRAS_REGISTRADAS');
  pending[0]({data:fixture()});await a;assert.ok(s.states.at(-1).dados.habitos);
  s.abort.abort();assert.deepEqual(s.states.at(-1),{status:'session',dados:null});s.q.dispose();
  const t=service(()=>new Promise(r=>pending.push(r)));const c=t.q.consultar();await tick();t.q.dispose();const count=t.states.length;pending.at(-1)({data:fixture()});await c;assert.equal(t.states.length,count);
});
test('erro e contrato inválido são distintos de vazio real e nunca reutilizam resumo anterior',async()=>{
  for(const get of [async()=>{throw Error('offline');},async()=>({data:fixture(false,'2026-09')})]) {
    const s=service(get);await s.q.consultar();assert.deepEqual(s.states.at(-1),{status:'error',dados:null});s.q.dispose();
  }
  const d=fixture();Object.assign(d,{universo:0,comContexto:0,comAutopercepcao:0,disponibilidade:'SEM_DADOS',reflexao:'Nenhuma compra elegível neste período.'});
  const s=service(async()=>({data:d}));await s.q.consultar();assert.equal(s.states.at(-1).status,'ready');assert.equal(s.states.at(-1).dados.universo,0);s.q.dispose();
});
const texto=n=>typeof n==='string'||typeof n==='number'?String(n):n?.props?.children?.map(texto).join('')||'';
test('componente apresenta quatro blocos somente após abrir, fecha e limpa em filtro, background e sessão',async()=>{
  const calls=[],abort=new AbortController();let appListener;
  const h=createRenderer({'react-native':{View:'View',Text:'Text',Pressable:'Pressable',Modal:'Modal',ScrollView:'ScrollView',ActivityIndicator:'ActivityIndicator',StyleSheet:{create:v=>v},AppState:{addEventListener:(_event,listener)=>{appListener=listener;return {remove(){}};}}},
    '../../../api/client':{apiClient:{get:async(url,options)=>{calls.push({url,options});return {data:fixture(options.params.detalhes==='1',options.params.mes,options.params.comportamento==='1')};}}},
    '../../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:7,signal:abort.signal}),assertSession:()=>{if(abort.signal.aborted)throw Error('SESSION_REQUIRED');}}}});
  h.mount(h.load('src/components/PurchaseComponents/PanoramaCompras/index.js').default,{filtros,active:true,refreshKey:0});await h.flush();
  assert.equal(calls.length,1);assert.equal(h.nodes(n=>n.type==='Modal')[0].props.visible,false);
  const press=label=>{const button=h.nodes(n=>n.type==='Pressable'&&(n.props.accessibilityLabel===label||texto(n).includes(label)))[0];assert.ok(button,label);button.props.onPress();};
  press('Explorar análise do período');await h.flush();assert.equal(calls.length,2);assert.equal(calls[0].options.params.comportamento,undefined);assert.equal(calls[1].options.params.comportamento,'1');assert.equal(h.nodes(n=>n.type==='Modal')[0].props.visible,true);
  let displayed=h.nodes(n=>n.type==='Text').map(texto).join(' ');for(const label of ['Resumo do período','Destaque do período','Hábitos de compra','Fatores observados','Reflexão de outubro','Vínculos registrados'])assert.ok(displayed.includes(label),label);
  assert.equal(displayed.split('Vínculos registrados').length-1,1);
  assert.match(displayed,/outubro de 2026/i);assert.doesNotMatch(displayed,/Relações relevantes/);
  press('Detalhes de Promoções');await h.flush();displayed=h.nodes(n=>n.type==='Text').map(texto).join(' ');assert.match(displayed,/2 compras com resposta válida/);assert.match(displayed,/1 compra com resposta “não”/);
  h.update({filtros:{...filtros,mes:'2026-09'}});await h.flush();assert.equal(h.nodes(n=>n.type==='Modal')[0].props.visible,false);assert.equal(calls.at(-1).options.params.mes,'2026-09');
  appListener('background');await h.flush();assert.doesNotMatch(h.nodes(n=>n.type==='Text').map(texto).join(' '),/1 de 2/);
  appListener('active');await h.flush();abort.abort();await h.flush();assert.match(h.nodes(n=>n.type==='Text').map(texto).join(' '),/Sua sessão mudou/);
  h.update({active:false});await h.flush();assert.equal(h.nodes(n=>n.type==='Text').length,0);h.unmount();
});
test('integração preserva FlatList e acesso à compra; paginação não recalcula panorama',()=>{
  const source=readFileSync(new URL('../src/pages/PurchasesScreen/index.js',import.meta.url),'utf8');
  const header=source.slice(source.indexOf('ListHeaderComponent'),source.indexOf('contentContainerStyle={styles.listContent}'));
  assert.ok(header.indexOf('<FiltroTemporalCompras')<header.indexOf('<PanoramaCompras'));
  assert.match(source,/if \(!append\) setPanoramaRevision/);assert.match(source,/<FlatList/);assert.match(source,/<ContextoCompra etapaInicial="compra"/);
});
