import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { createRenderer } from './helpers/componentRenderer.mjs';

const row = id => ({avaliacaoId:id,criadaEm:'2026-10-24T12:00:00Z',contextoRevisao:1,versaoMotor:'contextual-1',atualidade:'DESATUALIZADA'});
function screen(get, modo = 'avaliacoes') {
  const controller = new AbortController(), calls=[];
  const client={get:async(...args)=>{
    calls.push(args);
    const id=args[0].match(/\/avaliacoes\/(\d+)$/)?.[1];
    if(id){const meta=row(Number(id));const resultado=JSON.parse(readFileSync(new URL('./fixtures/contextualRefinamento.json',import.meta.url),'utf8'));resultado.versaoMotor=meta.versaoMotor;
      return {data:{versaoContrato:1,compraId:1,avaliacaoId:meta.avaliacaoId,criadaEm:meta.criadaEm,atualidade:'DESATUALIZADA',motivos:['DADOS_UTILIZADOS_ALTERADOS'],resultado}};}
    return {data:await get(...args)};
  }};
  const storage={captureSession:async()=>({id:1,signal:controller.signal}),assertSession:()=>{if(controller.signal.aborted)throw Error('session');}};
  const h=createRenderer({
    '../../api/client':{apiClient:client},'../../../api/client':{apiClient:client},
    '../../api/tokenStorage':{tokenStorage:storage},'../../../api/tokenStorage':{tokenStorage:storage},
  });
  h.mount(h.load('src/components/PurchaseComponents/HistoricoAvaliacoes.js').default,{compraId:1,revisao:1,modo});
  const text=node=>typeof node==='string'||typeof node==='number'?String(node):node?.props?.children?.map(text).join('')||'';
  const press=label=>{const button=h.nodes(node=>node.type==='Pressable' && text(node)===label)[0];assert.ok(button,label);button.props.onPress();};
  return {h,calls,controller,press,text:()=>h.nodes(node=>node.type==='Text').map(text).join(' ')};
}
test('F33: histórico pagina metadados e abre somente a avaliação selecionada',async()=>{
  const s=screen(async(_url,config)=>({versaoContrato:1,compraId:1,
    avaliacoes:config.params.antes===undefined?Array.from({length:20},(_,index)=>row(25-index)):[row(5)],
    proximoAntes:config.params.antes===undefined?6:null}));
  await s.h.flush();assert.match(s.text(),/Anterior/);assert.match(s.text(),/Desatualizada/);
  s.h.nodes(node=>node.type==='Pressable' && node.props.accessibilityState)[0].props.onPress();await s.h.flush();
  assert.ok(s.calls.some(([url])=>url.endsWith('/avaliacoes/25')));assert.match(s.text(),/Fatores considerados/);
  s.press('Avaliações anteriores');await s.h.flush();assert.equal(s.calls.filter(([url])=>url.endsWith('/historico'))[1][1].params.antes,6);
  assert.doesNotMatch(s.text(),/Fatores considerados/);
  s.press('Voltar às mais recentes');await s.h.flush();assert.deepEqual(s.calls.filter(([url])=>url.endsWith('/historico'))[2][1].params,{explicacao:'1'});
  s.controller.abort();await s.h.flush();assert.doesNotMatch(s.text(),/Anterior/);assert.match(s.text(),/sessão mudou/);
  s.h.unmount();
});
test('F33: erro, vazio e resposta de outra compra não são confundidos',async()=>{
  for(const kind of ['network','empty','foreign']) {
    const s=screen(async()=>{if(kind==='network')throw Error('offline');return {versaoContrato:1,compraId:kind==='foreign'?2:1,avaliacoes:[],proximoAntes:null};});
    await s.h.flush();assert.match(s.text(),kind==='empty'?/Nenhuma avaliação registrada/:/Não foi possível consultar/);s.h.unmount();
  }
});

test('reflexoes reutilizam paginas de avaliacoes sem carregar resultados por linha',async()=>{
  const s=screen(async()=>({versaoContrato:1,compraId:1,avaliacoes:[row(2),row(1)],proximoAntes:null}),'reflexoes');
  await s.h.flush();assert.equal(s.calls.length,1);assert.match(s.text(),/Nenhuma reflexão registrada/);
  assert.doesNotMatch(s.text(),/Fatores considerados/);
  s.h.nodes(n=>n.type==='Pressable'&&n.props.accessibilityState)[0].props.onPress();await s.h.flush();
  assert.ok(s.calls.some(([url])=>url.endsWith('/avaliacoes/2')));assert.doesNotMatch(s.text(),/Fatores considerados|Planejamento/);assert.match(s.text(),/A oferta antecipou/);assert.equal(s.calls.length,2);s.h.unmount();
});
