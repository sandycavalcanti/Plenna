import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validarAvaliacao, validarExplicacaoAvaliacao, consultarAvaliacaoComExplicacao} from '../src/services/avaliacaoCompraService.js';
import {createRenderer} from './helpers/componentRenderer.mjs';

const fixture=name=>JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url),'utf8'));
const explanation=()=>fixture('avaliacaoExplicacao');
const result=()=>fixture('contextualRefinamento');
const envelope=()=>({versaoContrato:1,compraId:1,avaliacaoId:4,criadaEm:'2026-10-30T12:00:00Z',atualidade:'VIGENTE',motivos:[],resultado:result(),explicacao:explanation()});
const text=n=>typeof n==='string'?n:n?.props?.children?.map(text).join('')||'';

test('projeção real da API conserva todos os fatores e aceita servidor sem extensão',()=>{
  const d=envelope();assert.equal(validarAvaliacao(d,1),d);
  assert.equal(d.explicacao.fatoresCompletos,true);
  assert.ok(d.explicacao.fatores.some(f=>f.campo==='planejamento'));
  assert.ok(d.explicacao.fatores.some(f=>f.campo==='influenciaPromocional'));
  assert.ok(d.explicacao.fatores.some(f=>f.itemId===10));
  delete d.explicacao;assert.equal(validarAvaliacao(d,1),d);
  for(const change of [e=>e.origem='ATUAL_RECALCULADO',e=>e.fatores[0].natureza='DIAGNOSTICO',e=>e.totalFatores=0,e=>e.fatoresCompletos=false]) {
    const e=explanation();change(e);assert.throws(()=>validarExplicacaoAvaliacao(e));
  }
  const incoherent=envelope();incoherent.explicacao.resumo='Outro resultado';assert.throws(()=>validarAvaliacao(incoherent,1));
});

test('GET negocia extensão, mantém cursor e só faz fallback em 400 de servidor anterior',async()=>{
  const calls=[],options={params:{antes:8},signal:new AbortController().signal};
  const client={get:async(url,config)=>{calls.push({url,config});if(calls.length===1)throw {response:{status:400}};return {data:'legacy'};}};
  assert.equal((await consultarAvaliacaoComExplicacao(client,'/historico',options)).data,'legacy');
  assert.deepEqual(calls[0].config.params,{antes:8,explicacao:'1'});assert.deepEqual(calls[1].config.params,{antes:8});
  for(const status of [401,403,404,409,500]) {
    let count=0;await assert.rejects(consultarAvaliacaoComExplicacao({get:async()=>{count++;throw {response:{status}};}},'/historico',options));assert.equal(count,1);
  }
  const controller=new AbortController();let count=0;
  await assert.rejects(consultarAvaliacaoComExplicacao({get:async()=>{count++;controller.abort();throw {response:{status:400}};}},'/historico',{signal:controller.signal}));assert.equal(count,1);
});

test('lista fica compacta e carrega fatores completos somente da avaliação expandida',async()=>{
  const controller=new AbortController(),calls=[];
  const client={get:async(url,options)=>{calls.push({url,options});return {data:url.endsWith('/historico')?{versaoContrato:1,compraId:1,proximoAntes:null,avaliacoes:[4,3].map(avaliacaoId=>({avaliacaoId,criadaEm:'2026-10-30T12:00:00Z',contextoRevisao:1,versaoMotor:'contextual-2',atualidade:'DESATUALIZADA',explicacao:{...explanation(),fatores:explanation().fatores.slice(0,3),fatoresCompletos:false}}))}:envelope()};}};
  const storage={captureSession:async()=>({id:1,signal:controller.signal}),assertSession:()=>{}};
  const h=createRenderer({
    '../../api/client':{apiClient:client},'../../../api/client':{apiClient:client},
    '../../api/tokenStorage':{tokenStorage:storage},'../../../api/tokenStorage':{tokenStorage:storage},
  });
  h.mount(h.load('src/components/PurchaseComponents/HistoricoAvaliacoes.js').default,{compraId:1,revisao:2});await h.flush();
  const displayed=()=>h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.equal(calls.length,1);assert.equal(calls[0].options.params.explicacao,'1');
  assert.doesNotMatch(displayed(),/Você informou|Fatores considerados/);
  const header=()=>h.nodes(n=>n.type==='Pressable'&&n.props.accessibilityLabel?.startsWith('Avaliação registrada'))[0];
  header().props.onPress();await h.flush();
  assert.equal(calls.length,2);assert.ok(calls[1].url.endsWith('/avaliacoes/4'));
  assert.match(displayed(),/Fatores considerados|Planejamento/);assert.match(displayed(),/Alimentacao ficticia/);assert.match(displayed(),/Limpeza ficticia/);
  assert.doesNotMatch(displayed(),/Você informou|Relação calculada|Como chegamos/);
  header().props.onPress();await h.flush();header().props.onPress();await h.flush();assert.equal(calls.length,2);
  h.unmount();
});

test('detalhes distinguem proveniências e exibem múltiplos fatores sem gravar',async()=>{
  const d=envelope();const controller=new AbortController(),calls=[];
  const h=createRenderer({
    '../../../api/client':{apiClient:{get:async(url)=>{calls.push(url);return {data:d};},post:()=>{throw Error('UNEXPECTED_WRITE');}}},
    '../../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:1,signal:controller.signal}),assertSession:()=>{}}},
  });
  h.mount(h.load('src/components/PurchaseComponents/AvaliacaoContextual/index.js').default,{compraId:1,revisao:1,avaliacaoId:4});await h.flush();
  h.nodes(n=>n.type==='Pressable'&&text(n)==='Como chegamos a esta reflexão')[0].props.onPress();await h.flush();
  const displayed=h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed,/Registros considerados/);assert.match(displayed,/Você informou/);
  assert.match(displayed,/Alimentacao ficticia/);assert.match(displayed,/Limpeza ficticia/);
  assert.match(displayed,/não foram acrescentados retroativamente/);assert.equal(calls.length,1);
  assert.equal(h.nodes(n=>n.type==='Pressable'&&/Gerar reflexão|Atualizar reflexão/.test(text(n))).length,0);
  h.unmount();
});
