import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer} from './helpers/componentRenderer.mjs';
const text=n=>n===null||n===undefined||typeof n==='boolean'?'':typeof n==='object'?(n.props?.children||[]).map(text).join(''):String(n);
const event=(id,itemId=null)=>({id,revisao:id,itemId,tipo:'REEMBOLSO',dados:{valorCentavos:100},dataEfetiva:'2026-10-30',registradaEm:'2026-10-31T12:00:00Z',corrigido:false,anulado:false});
function mount({itemId,invalid=false,active=true,compra,finalidade='COMPRA',decisoes=false}={}){
 const calls=[],controller=new AbortController(),h=createRenderer({
  '../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:1,signal:controller.signal}),assertSession:()=>{if(controller.signal.aborted)throw Error('SESSION');}}},
  '../../api/client':{apiClient:{get:async(url,{params})=>{calls.push({url,params});const rows=params.antes?[event(1,itemId??(params.escopo==='ITENS'?2:null))]:Array.from({length:50},(_,i)=>event(100-i,itemId??(params.escopo==='ITENS'?2:null)));return {data:{versaoContrato:1,compraId:1,eventos:invalid?[...rows,rows[0]]:decisoes?rows.map((e,i)=>i%2?e:{...e,tipo:'RESPOSTA_ANALISE',dataEfetiva:null,dados:{resposta:'NAO_SEI',versaoMotor:'contextual-2'}}):rows,proximaAntes:params.antes?null:51}};}}},
 });
 h.mount(h.load('src/components/PurchaseComponents/HistoricoEventos.js').default,{compraId:1,compra,itemId,active,finalidade});
 return {h,calls,controller,press(label){const node=h.nodes(n=>n.type==='Pressable'&&text(n)===label)[0];assert.ok(node,label);node.props.onPress();}};
}
test('histórico substitui páginas, mantém filtro e descarta dados ao revogar sessão',async()=>{
 const s=mount();await s.h.flush();assert.equal(s.calls.length,1);
 s.press('Itens');await s.h.flush();assert.equal(s.calls.at(-1).params.escopo,'ITENS');
 s.press('Eventos anteriores');await s.h.flush();assert.deepEqual(s.calls.at(-1).params,{finalidade:'COMPRA',antes:51,escopo:'ITENS'});
 assert.equal(s.h.nodes(n=>n.type==='Text'&&text(n)==='R$ 1,00').length,1);
 s.controller.abort();await s.h.flush();assert.equal(s.h.nodes(n=>n.type==='Text'&&text(n)==='R$ 1,00').length,0);s.h.unmount();
});
test('histórico do item envia identidade específica e rejeita página inválida',async()=>{
 const s=mount({itemId:2});await s.h.flush();assert.deepEqual(s.calls[0].params,{finalidade:'COMPRA',itemId:2});assert.equal(s.h.nodes(n=>n.props.accessibilityRole==='radio').length,0);s.h.unmount();
 const bad=mount({invalid:true});await bad.h.flush();assert.ok(bad.h.nodes(n=>text(n).includes('Não foi possível carregar')).length);bad.h.unmount();
});
test('histórico oculto não consulta e retorno à aba reutiliza somente a página atual',async()=>{
 const s=mount({active:false});await s.h.flush();assert.equal(s.calls.length,0);
 s.h.update({active:true});await s.h.flush();assert.equal(s.calls.length,1);
 s.h.update({active:false});await s.h.flush();s.h.update({active:true});await s.h.flush();assert.equal(s.calls.length,1);s.h.unmount();
});

test('finalidade separates persisted decisions without technical copy',async()=>{
 const purchase=mount({decisoes:true});await purchase.h.flush();
 assert.equal(purchase.calls[0].params.finalidade,'COMPRA');
 assert.equal(purchase.h.nodes(n=>n.type==='Text'&&text(n).includes('Resposta')).length,0);purchase.h.unmount();
 const analysis=mount({finalidade:'ANALISE',decisoes:true});await analysis.h.flush();
 assert.equal(analysis.calls[0].params.finalidade,'ANALISE');
 assert.equal(analysis.h.nodes(n=>n.props.accessibilityRole==='radio').length,0);
 const copy=analysis.h.nodes(n=>n.type==='Text').map(text).join(' ');
 assert.match(copy,/N\u00e3o sei/);assert.doesNotMatch(copy,/contextual-2|Data efetiva|Vinculada|Origem:/);
 analysis.press('Eventos anteriores');await analysis.h.flush();assert.equal(analysis.calls.at(-1).params.antes,51);analysis.h.unmount();
});

test('creation uses the stored date and appears only on the last purchase page',async()=>{
 const s=mount({compra:{compra_data_criacao:'2026-10-30T10:00:00Z'}});await s.h.flush();
 assert.equal(s.h.nodes(n=>n.type==='Text'&&text(n)==='Compra criada').length,0);
 s.press('Eventos anteriores');await s.h.flush();assert.equal(s.h.nodes(n=>n.type==='Text'&&text(n)==='Compra criada').length,1);
 s.press('Itens');await s.h.flush();assert.equal(s.h.nodes(n=>n.type==='Text'&&text(n)==='Compra criada').length,0);s.h.unmount();
});
