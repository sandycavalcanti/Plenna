import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer} from './helpers/componentRenderer.mjs';
import {classificacoesPeriodo} from '../src/components/PurchaseComponents/PanoramaCompras/detalhamento.js';
const text=n=>typeof n==='string'||typeof n==='number'?String(n):n?.props?.children?.map(text).join('')||'';
const avaliacao={avaliacaoId:4,resultado:{versaoMotor:'contextual-2'}};
const sinais={id:'sinais-contextuais-1:compositor-contextual-1:4:PROMOCAO_MOMENTO',versao:'sinais-contextuais-1',estado:'OBSERVADOS'};
const ack=(b)=>({data:{versaoContrato:1,compraId:1,persistido:true,evento:{id:1,operacaoId:b.operacaoId,revisao:b.revisaoEsperada+1,tipo:b.tipo,itemId:null,dataEfetiva:null,corrigeEventoId:null,anulado:false,dados:b}}});
async function mount(post){const abort=new AbortController(),calls=[],saved=[];let uuid=0;
  const h=createRenderer({'expo-crypto':{randomUUID:()=>`00000000-0000-4000-8000-${String(++uuid).padStart(12,'0')}`},'../../../api/client':{apiClient:{post:async(u,b)=>{calls.push({u,b});return post?post(b):ack(b);}}},'../../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:7,signal:abort.signal}),assertSession:()=>{if(abort.signal.aborted)throw Error('SESSION_REQUIRED');}}}});
  h.mount(h.load('src/components/PurchaseComponents/AnaliseCompra/RespostaAnalise.js').default,{compraId:1,avaliacao,sinais,revisaoEventos:2,eventos:[],onSaved:()=>saved.push(true)});await h.flush();
  return {h,abort,calls,saved,radios:()=>h.nodes(n=>n.props.accessibilityRole==='radio')};
}
test('concordância explícita classifica; duplo toque e repetir opção salva não criam outra intenção',async()=>{
  const s=await mount();const button=s.radios()[0];assert.match(text(button),/classificar como impulsiva/);button.props.onPress();button.props.onPress();await s.h.flush();assert.equal(s.calls.length,1);assert.equal(s.calls[0].b.confirmarImpulsiva,true);assert.equal(s.calls[0].b.avaliacaoId,4);assert.equal(s.saved.length,1);
  s.radios()[0].props.onPress();await s.h.flush();assert.equal(s.calls.length,1);
  s.radios()[1].props.onPress();await s.h.flush();assert.equal(s.calls[1].b.resposta,'DISCORDO');assert.equal(s.calls[1].b.confirmarImpulsiva,false);assert.equal(s.calls[1].b.classificacao,undefined);s.h.unmount();
});
test('resposta incerta mantém UUID e intenção; não permite trocar escolha antes de recuperar confirmação',async()=>{
  let count=0;const s=await mount(b=>{if(++count===1)throw {isAxiosError:true};return ack(b);});
  s.radios()[0].props.onPress();await s.h.flush();assert.equal(s.saved.length,0);assert.equal(s.radios()[1].props.disabled,true);
  s.radios()[1].props.onPress();await s.h.flush();assert.equal(s.calls.length,1);
  s.radios()[0].props.onPress();await s.h.flush();assert.equal(s.calls.length,2);assert.equal(s.calls[0].b.operacaoId,s.calls[1].b.operacaoId);assert.equal(s.saved.length,1);s.h.unmount();
});
test('ack inválido não vira sucesso; sessão revogada antes do retorno impede atualização da UI',async()=>{
  const s=await mount(b=>({...ack(b),data:{...ack(b).data,evento:{...ack(b).data.evento,dados:{...b,avaliacaoId:5}}}}));s.radios()[0].props.onPress();await s.h.flush();assert.equal(s.saved.length,0);assert.match(s.h.nodes(n=>n.type==='Text').map(text).join(' '),/não confirmou/);s.h.unmount();
  let finish;const t=await mount(b=>new Promise(r=>{finish=()=>r(ack(b));}));t.radios()[1].props.onPress();await t.h.flush();t.abort.abort();finish();await t.h.flush();assert.equal(t.saved.length,0);t.h.unmount();
});
test('avaliação ou compra nova não recebe confirmação de resposta atrasada da anterior',async()=>{
  let finish;const s=await mount(b=>new Promise(r=>{finish=()=>r(ack(b));}));s.radios()[0].props.onPress();await s.h.flush();s.h.update({avaliacao:{...avaliacao,avaliacaoId:5},sinais:{...sinais,id:sinais.id.replace(':4:',':5:')}});await s.h.flush();finish();await s.h.flush();assert.equal(s.saved.length,0);assert.ok(s.radios().every(n=>!n.props.accessibilityState.selected));s.h.unmount();
});
test('concordar com interpretação sem sinais não classifica e histórico preserva a resposta vinculada',async()=>{
  const s=await mount();s.h.update({sinais:{...sinais,estado:'LIMITADAS'}});await s.h.flush();s.radios()[0].props.onPress();await s.h.flush();assert.equal(s.calls[0].b.confirmarImpulsiva,false);
  s.h.update({eventos:[{tipo:'RESPOSTA_ANALISE',dados:{avaliacaoId:4,interpretacaoId:sinais.id,resposta:'DISCORDO'}}],sinais:{...sinais,id:sinais.id+':OUTRA'}});await s.h.flush();assert.ok(s.radios().every(n=>!n.props.accessibilityState.selected));s.h.unmount();
});
test('Panorama separa classificação registrada de respostas de impulso; sem classificação é o complemento do universo elegível',()=>{
  const d={universo:9,sinais:[{codigo:'CLASSIFICADA_IMPULSIVA',condicao:2,validos:5},{codigo:'CLASSIFICADA_NAO_IMPULSIVA',condicao:3,validos:5},{codigo:'IMPULSO',condicao:8,validos:9}]};
  assert.deepEqual(classificacoesPeriodo(d),{impulsivas:2,naoImpulsivas:3,semClassificacao:4});assert.equal(classificacoesPeriodo({...d,sinais:[]}),null);d.sinais[1].condicao=4;assert.equal(classificacoesPeriodo(d),null);
});
