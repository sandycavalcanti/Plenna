import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer } from './helpers/componentRenderer.mjs';

const saved = resultado => ({versaoContrato:1,compraId:1,atualidade:'VIGENTE',avaliacaoId:4,criadaEm:'2026-10-30T12:00:00Z',motivos:[],resultado});
const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) : node?.props?.children?.map(text).join('') || '';

test('contexto válido sem limite convive com fonte automática independente, sem escrita ou consulta contextual duplicada', async () => {
  const data = fixture('historicoCompra');
  data.contextual = fixture('contextualRefinamento');
  data.dependenciasHistoricas.versaoMotorContextual = data.contextual.versaoMotor;
  const calls = [], controller = new AbortController();
  const h = createRenderer({
    '../../../api/client': { apiClient: { get: async url => { calls.push(url); return { data:url.endsWith('/avaliacoes/atual')?saved(data.contextual):data }; }, post: () => { throw Error('UNEXPECTED_WRITE'); } } },
    '../../../api/tokenStorage': { tokenStorage: { captureSession: async () => ({ id: 1, signal: controller.signal }), assertSession: () => {} } },
    '../AnaliseAutomatica': { __esModule: true, default: () => ({ type: 'NumericAnalysis', props: { children: [] } }) },
  });
  const component = h.load('src/components/PurchaseComponents/DescobertasCompra/index.js').default;
  h.mount(component, { compraId: 1, revisao: 1, compact: true });
  await h.flush();
  const displayed = () => h.nodes(n => n.type === 'Text').map(text).join(' ');
  assert.match(displayed(), /compra não estava nos seus planos/);
  assert.equal(h.nodes(n => n.type === 'NumericAnalysis').length, 1);
  assert.equal(calls.length, 1);
  assert.doesNotMatch(displayed(), /A partir do que você contou|O PLENNA observou|Motor contextual/);
  h.update({ compraId: 1, revisao: 1, compact: true, active: false });
  await h.flush();
  h.update({ compraId: 1, revisao: 1, compact: true, active: true });
  await h.flush();
  assert.equal(calls.length, 1);
  h.nodes(n => n.type === 'Pressable' && text(n) === 'Entender esta análise')[0].props.onPress();
  await h.flush();
  assert.equal(h.nodes(n => n.type === 'NumericAnalysis').length, 1);
  assert.match(displayed(), /Como o Plenna interpretou/);
  assert.match(displayed(), /As associações não comprovam causa/);
  assert.doesNotMatch(displayed(), /avaliação 4|contexto 1|R7_CONTEXTO/);
  assert.equal(calls.length, 1);
  h.unmount();
});

test('análise compacta suporta montagem sem revisão ou dados, sem quebrar o carregamento', async () => {
  const controller = new AbortController();
  const h = createRenderer({
    '../../../api/client': { apiClient: { get: async () => { throw Error('OFFLINE'); } } },
    '../../../api/tokenStorage': { tokenStorage: { captureSession: async () => ({ id: 1, signal: controller.signal }), assertSession: () => {} } },
  });
  h.mount(h.load('src/components/PurchaseComponents/DescobertasCompra/index.js').default, { compraId: 1, compact: true });
  await h.flush();
  assert.match(h.nodes(n => n.type === 'Text').map(text).join(' '), /Não foi possível consultar/);
  h.unmount();
});

test('respostas incertas ou recusadas não viram respostas negativas nem fatores financeiros', async () => {
  const data=fixture('historicoCompra');
  data.contextual=fixture('contextualIncerto');
  data.dependenciasHistoricas.versaoMotorContextual=data.contextual.versaoMotor;
  const controller=new AbortController();
  const h=createRenderer({
    '../../../api/client':{apiClient:{get:async url=>({data:url.endsWith('/avaliacoes/atual')?saved(data.contextual):data})}},
    '../../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:1,signal:controller.signal}),assertSession:()=>{}}},
    '../AnaliseAutomatica':{__esModule:true,default:()=>null},
  });
  h.mount(h.load('src/components/PurchaseComponents/DescobertasCompra/index.js').default,{compraId:1,revisao:1,compact:true});
  await h.flush();
  const displayed=()=>h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed(),/Sem evidências contextuais válidas/);
  assert.doesNotMatch(displayed(),/Sem excesso conhecido|Principais fatores/);
  h.nodes(n=>n.type==='Pressable'&&text(n)==='Entender esta análise')[0].props.onPress();
  await h.flush();
  assert.match(displayed(),/Não lembro/);
  assert.match(displayed(),/Prefiro não responder/);
  assert.doesNotMatch(displayed(),/Sem excesso conhecido/);
  h.unmount();
});

test('painel explicativo monta sob demanda e fecha pelo botão e pelo voltar nativo', async () => {
  let mounts = 0;
  const h = createRenderer();
  const Child = () => { mounts++; return {type:'Text',props:{children:['Evidência registrada']}}; };
  const Details=h.load('src/components/ReadingDetails/index.js').default;
  h.mount(props=>h.React.createElement(Details,{label:'Como analisamos',presentation:'sheet',active:props.active},h.React.createElement(Child,{})),{active:true});
  await h.flush();
  assert.equal(mounts,0);
  h.nodes(n=>n.type==='Pressable'&&text(n)==='Como analisamos')[0].props.onPress();
  await h.flush();
  assert.equal(h.nodes(n=>n.type==='Modal').length,1);
  assert.ok(mounts>0);
  h.nodes(n=>n.props.accessibilityLabel==='Fechar Como analisamos')[0].props.onPress();
  await h.flush();
  assert.equal(h.nodes(n=>n.type==='Modal').length,0);
  h.nodes(n=>n.type==='Pressable'&&text(n)==='Como analisamos')[0].props.onPress();
  await h.flush();
  h.nodes(n=>n.type==='Modal')[0].props.onRequestClose();
  await h.flush();
  assert.equal(h.nodes(n=>n.type==='Modal').length,0);
  h.nodes(n=>n.type==='Pressable'&&text(n)==='Como analisamos')[0].props.onPress();
  await h.flush();
  h.update({active:false});await h.flush();assert.equal(h.nodes(n=>n.type==='Modal').length,0);
  h.update({active:true});await h.flush();assert.equal(h.nodes(n=>n.type==='Modal').length,0);
  h.unmount();
});
