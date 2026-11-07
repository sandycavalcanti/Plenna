import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRenderer} from './helpers/componentRenderer.mjs';
import {apresentarContextoHistorico,apresentarAvaliacaoHistorica,trechosHistoricos,dataHistorico} from '../src/components/PurchaseComponents/RegistrosContextuais/apresentacao.js';
const fixture=name=>JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url),'utf8'));
const text=n=>typeof n==='string'||typeof n==='number'?String(n):n?.props?.children?.map(text).join('')||'';
const snapshot=(revisao,respostas={},itens=[],eventosPosteriores=[])=>({versaoContrato:1,compraId:1,revisao,criadaEm:'2026-11-05T07:12:00Z',respostas,itens,eventosPosteriores});
const meta=(id=4,extra={})=>({avaliacaoId:id,criadaEm:'2026-10-30T12:00:00Z',contextoRevisao:1,versaoMotor:'contextual-2',atualidade:'DESATUALIZADA',...extra});
const saved=id=>({versaoContrato:1,compraId:1,avaliacaoId:id,criadaEm:meta().criadaEm,atualidade:'DESATUALIZADA',motivos:['DADOS_UTILIZADOS_ALTERADOS'],resultado:fixture('contextualRefinamento'),explicacao:fixture('avaliacaoExplicacao')});

test('respostas históricas preservam ausência, recusa, itens e mudanças sem usar nomes atuais',()=>{
  const old=snapshot(1,{planejamento:'SIM',influenciaPromocional:'NAO'},[{itemId:10,planejamento:'SIM'}]);
  const now=snapshot(2,{planejamento:'PARCIALMENTE',momento:'NAO_LEMBRO',autopercepcaoImpulsividade:'PREFIRO_NAO_RESPONDER'},[{itemId:11,planejamento:'PARCIALMENTE'}],['ARREPENDIMENTO']);
  const before=structuredClone([old,now]),view=apresentarContextoHistorico(now,old);
  assert.equal(view.rows.find(r=>r.id==='planejamento').value,'Em parte');
  assert.equal(view.rows.find(r=>r.id==='planejamento').antes,'Planejada');
  assert.equal(view.rows.find(r=>r.id==='influenciaPromocional').value,'Não informado');
  assert.equal(view.rows.find(r=>r.id==='ARREPENDIMENTO').value,'Informado');
  assert.equal(view.rows.find(r=>r.id==='momento').value,'Não lembro');
  assert.equal(view.rows.find(r=>r.id==='autopercepcaoImpulsividade').value,'Prefiro não responder');
  assert.equal(view.items.find(r=>r.id==='item:10').value,'Não informado');
  assert.equal(view.items.find(r=>r.id==='item:11').value,'Em parte');
  assert.equal(view.alteracoes,7);assert.deepEqual([old,now],before);
  assert.deepEqual(view.ausentes,['Necessidade inesperada']);
});

test('sem revisão adjacente não inventa indicador de alteração; ausência é agrupada',()=>{
  const view=apresentarContextoHistorico(snapshot(5),snapshot(1,{planejamento:'SIM'}));
  assert.equal(view.alteracoes,0);assert.equal(view.ausentes.length,5);
  assert.equal(view.rows.length,1);assert.equal(view.rows[0].label,'Arrependimento');
  assert.equal(dataHistorico(null),'Data não disponível');assert.equal(dataHistorico('2026-11-05T07:12:00Z'),'05/11/2026, 04:12');
});

test('avaliação histórica conserva síntese original, fatores e nomes da época sem compositor',()=>{
  const r=fixture('contextualRefinamento'),before=structuredClone(r),view=apresentarAvaliacaoHistorica(r);
  assert.match(view.resultado,/compra não estava planejada/);
  assert.equal(view.pergunta,'A oferta antecipou uma necessidade ou despertou uma vontade nova?');
  assert.ok(view.fatores.some(f=>f.label==='Alimentacao ficticia'&&f.value==='Planejado'));
  assert.ok(view.fatores.some(f=>f.label==='Limpeza ficticia'&&f.value==='Não planejado'));
  assert.equal(view.fatores.find(f=>f.id==='influenciaPromocional').value,'Influenciou');
  assert.deepEqual(r,before);
  const incerto=apresentarAvaliacaoHistorica(fixture('contextualIncerto'));
  assert.equal(incerto.fatores.length,0);assert.equal(incerto.outras[0].value,'Não lembro');
  assert.equal(incerto.outras[1].value,'Prefiro não responder');
  assert.equal(trechosHistoricos('Sem pergunta registrada.').pergunta,null);
});

function historyScreen({modo='avaliacoes',rows=[meta()],result=saved(4),failDetail=false,late=false}={}) {
  const calls=[],controller=new AbortController();let resolveDetail;
  const client={get:async(url,options)=>{
    calls.push({url,options});
    if(url.endsWith('/historico'))return {data:{versaoContrato:1,compraId:1,avaliacoes:rows,proximoAntes:null}};
    if(failDetail)throw Error('offline');
    if(late)return new Promise(resolve=>{resolveDetail=resolve;});
    return {data:result};
  },post:()=>{throw Error('HISTORICAL_WRITE_FORBIDDEN');}};
  const storage={captureSession:async()=>({id:1,signal:controller.signal}),assertSession:()=>{if(controller.signal.aborted)throw Error('SESSION');}};
  const h=createRenderer({'../../api/client':{apiClient:client},'../../../api/client':{apiClient:client},'../../api/tokenStorage':{tokenStorage:storage},'../../../api/tokenStorage':{tokenStorage:storage}});
  h.mount(h.load('src/components/PurchaseComponents/HistoricoAvaliacoes.js').default,{compraId:1,revisao:99,modo});
  const toggle=id=>{const button=h.nodes(n=>n.type==='Pressable'&&n.props.accessibilityLabel?.startsWith(`${modo==='reflexoes'?'Reflexão':'Avaliação'} registrada `))[rows.findIndex(row=>row.avaliacaoId===id)];assert.ok(button);button.props.onPress();};
  return {h,calls,controller,toggle,displayed:()=>h.nodes(n=>n.type==='Text').map(text).join(' '),resolve:()=>resolveDetail?.({data:result})};
}

test('registro desatualizado expande fielmente, recolhe e reutiliza snapshot somente por ID',async()=>{
  const s=historyScreen();await s.h.flush();
  assert.match(s.displayed(),/Anterior|Dados alterados/);assert.doesNotMatch(s.displayed(),/Fatores considerados/);assert.equal(s.calls.length,1);
  s.toggle(4);await s.h.flush();
  assert.match(s.displayed(),/compra não estava planejada/);assert.match(s.displayed(),/Fatores considerados/);
  assert.doesNotMatch(s.displayed(),/A oferta antecipou|Você informou|Como chegamos|Relações calculadas|compositor/);
  assert.ok(s.calls[1].url.endsWith('/avaliacoes/4'));assert.equal(s.calls.length,2);
  assert.equal(s.h.nodes(n=>n.type==='Pressable'&&n.props.accessibilityState?.expanded===true).length,1);
  s.toggle(4);await s.h.flush();assert.doesNotMatch(s.displayed(),/Fatores considerados/);
  s.toggle(4);await s.h.flush();assert.equal(s.calls.length,2);s.h.unmount();
});

test('reflexões da projeção não fazem N+1 nem repetem fatores ou inventam resposta voluntária',async()=>{
  const e=fixture('avaliacaoExplicacao');
  const s=historyScreen({modo:'reflexoes',rows:[meta(4,{atualidade:'VIGENTE',explicacao:{...e,fatores:e.fatores.slice(0,3),fatoresCompletos:false}})]});await s.h.flush();
  assert.match(s.displayed(),/Atual/);assert.match(s.displayed(),/A oferta antecipou/);
  assert.doesNotMatch(s.displayed(),/compra não estava planejada|Fatores considerados|Outra opção mais simples/);
  s.toggle(4);await s.h.flush();
  assert.equal(s.calls.length,1);assert.equal(s.displayed().split('A oferta antecipou uma necessidade ou despertou uma vontade nova?').length-1,1);
  assert.doesNotMatch(s.displayed(),/Planejamento|Promoção|Você informou|Atualizar reflexão|Gerar reflexão/);
  s.toggle(4);await s.h.flush();assert.equal(s.calls.length,1);s.h.unmount();
});

test('reflexão ausente tem estado próprio e não busca dados atuais',async()=>{
  const e={...fixture('avaliacaoExplicacao'),reflexao:null};
  const s=historyScreen({modo:'reflexoes',rows:[meta(4,{explicacao:e})]});await s.h.flush();
  assert.match(s.displayed(),/Sem pergunta reflexiva registrada/);s.toggle(4);await s.h.flush();
  assert.match(s.displayed(),/não registrou uma pergunta reflexiva/);assert.equal(s.calls.length,1);s.h.unmount();
});

test('projeção completa de avaliação dispensa GET por linha e usa somente fatores registrados',async()=>{
  const s=historyScreen({rows:[meta(4,{explicacao:fixture('avaliacaoExplicacao')})]});await s.h.flush();s.toggle(4);await s.h.flush();
  assert.match(s.displayed(),/Fatores considerados/);assert.match(s.displayed(),/Alimentacao ficticia/);assert.equal(s.calls.length,1);s.h.unmount();
});

test('erro de detalhe e snapshot com identidade/revisão divergente nunca mostram conteúdo alheio',async()=>{
  for(const options of [{failDetail:true},{result:{...saved(4),avaliacaoId:9}},{result:{...saved(4),resultado:{...fixture('contextualRefinamento'),contextoRevisao:2}}}]) {
    const s=historyScreen(options);await s.h.flush();s.toggle(4);await s.h.flush();
    assert.match(s.displayed(),/Não foi possível consultar este registro/);assert.doesNotMatch(s.displayed(),/Alimentacao ficticia|compra não estava planejada/);
    s.h.unmount();
  }
});

test('conteúdo indisponível não vira reflexão ausente nem reutiliza dados de outro registro',async()=>{
  const s=historyScreen({result:{...saved(4),resultado:null,explicacao:null}});await s.h.flush();s.toggle(4);await s.h.flush();
  assert.match(s.displayed(),/Conteúdo indisponível neste registro/);assert.doesNotMatch(s.displayed(),/Fatores considerados|compra não estava planejada/);
  s.h.unmount();
});

test('revogação da sessão descarta resposta tardia e snapshots em memória',async()=>{
  const s=historyScreen({late:true});await s.h.flush();s.toggle(4);await s.h.flush();
  s.controller.abort();s.resolve();await s.h.flush();
  assert.match(s.displayed(),/sessão mudou/);assert.doesNotMatch(s.displayed(),/Alimentacao ficticia|Dados alterados/);s.h.unmount();
});

test('respostas atuais e anteriores abrem sem expansões aninhadas e sem nomes atuais retroativos',async()=>{
  const controller=new AbortController(),rows=[snapshot(2,{planejamento:'PARCIALMENTE'},[{itemId:10,planejamento:'PARCIALMENTE'}],['ARREPENDIMENTO']),snapshot(1,{planejamento:'SIM'},[{itemId:10,planejamento:'SIM'}])];
  const h=createRenderer({'../../api/client':{apiClient:{get:async()=>({data:{versaoContrato:1,compraId:1,revisoes:rows,proximaAntes:null}})}},'../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:1,signal:controller.signal}),assertSession:()=>{}}}});
  h.mount(h.load('src/components/PurchaseComponents/HistoricoContexto.js').default,{compraId:1,revisao:1,itens:[{compra_item_id:10,compra_item_nome:'Nome editado hoje'}]});await h.flush();
  const toggle=id=>h.nodes(n=>n.type==='Pressable'&&n.props.accessibilityLabel?.startsWith('Respostas registradas '))[rows.findIndex(row=>row.revisao===id)].props.onPress();
  assert.equal(h.nodes(n=>n.type==='Text'&&text(n)==='Atual').length,1);
  toggle(2);await h.flush();let displayed=h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(displayed,/Em parte|Antes: Planejada|Item 10/);assert.doesNotMatch(displayed,/Nome editado hoje/);
  assert.equal(h.nodes(n=>n.type==='Pressable'&&n.props.accessibilityState?.expanded===true).length,1);
  toggle(1);await h.flush();assert.equal(h.nodes(n=>n.type==='Pressable'&&n.props.accessibilityState?.expanded===true).length,1);
  toggle(1);await h.flush();assert.equal(h.nodes(n=>n.type==='Text'&&text(n)==='Planejamento').length,0);h.unmount();
});
