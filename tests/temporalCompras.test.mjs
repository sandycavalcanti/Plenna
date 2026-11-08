import test from 'node:test';
import assert from 'node:assert/strict';
import {filtrosIniciais, filtrosTemporaisIniciais, parametrosTemporaisCompras, referenciaInicioHistorico} from '../src/utils/filtrosHistoricoCompras.js';
import {createRenderer} from './helpers/componentRenderer.mjs';
import {diaAtualCompras} from '../src/utils/filtrosHistoricoCompras.js';

test('mês inicial usa São Paulo na virada UTC e histórico inclui retroativos até hoje',()=>{
  const now=new Date('2026-11-01T02:59:59Z');
  assert.equal(filtrosTemporaisIniciais(now).mes,'2026-10');
  assert.equal(filtrosTemporaisIniciais(new Date('2027-01-01T03:00:00Z')).mes,'2027-01');
  assert.deepEqual(parametrosTemporaisCompras({...filtrosIniciais,status:'IGNORADA',busca:'ignorar'},now),{});
  assert.equal(referenciaInicioHistorico('2026-10-01T02:00:00Z'), '2026-09-30');
  assert.equal(referenciaInicioHistorico('2026-10-01T03:00:00Z',[{compra_horario:'2010-02-02T12:00:00Z'}]),'2026-10-01');
  assert.equal(referenciaInicioHistorico(undefined,[]),null);
});

test('limites usam criação persistida, sem depender de compras, e validam período personalizado',()=>{
 const now=new Date('2026-11-07T12:00:00Z'),min='2026-08-15';
 for(const mes of ['2026-08','2026-09','2026-11'])
   assert.deepEqual(parametrosTemporaisCompras({...filtrosIniciais,modo:'MES',mes},now,min),{mes});
 for(const mes of ['2026-07','2026-12'])
   assert.throws(()=>parametrosTemporaisCompras({...filtrosIniciais,modo:'MES',mes},now,min));
 const f={...filtrosIniciais,modo:'INTERVALO',inicio:'15/08/2026',fim:'07/11/2026'};
 assert.deepEqual(parametrosTemporaisCompras(f,now,min),{inicio:min,fim:'2026-11-07'});
 assert.throws(()=>parametrosTemporaisCompras({...f,inicio:'14/08/2026'},now,min));
 assert.deepEqual(parametrosTemporaisCompras(filtrosIniciais,now,min),{});
});

test('setas bloqueiam mês anterior à conta e futuro e liberam meses vazios',async()=>{
 const h=createRenderer(),calls=[],Component=h.load('src/components/PurchaseComponents/FiltroTemporalCompras.js').default;
 const current=diaAtualCompras().slice(0,7);
 const props={inicioHistorico:'2025-08-15',onChange:f=>calls.push(f)};
 h.mount(Component,{...props,filtros:{...filtrosIniciais,modo:'MES',mes:'2025-08'}});await h.flush();
 const button=label=>h.nodes(n=>n.props.accessibilityLabel===label)[0];
 assert.equal(button('Mês anterior').props.disabled,true);
 assert.equal(button('Próximo mês').props.disabled,false);
 button('Próximo mês').props.onPress();assert.equal(calls.at(-1).mes,'2025-09');
 h.update({ ...props,filtros:{...filtrosIniciais,modo:'MES',mes:current}});await h.flush();
 assert.equal(button('Próximo mês').props.disabled,true);
 h.unmount();
});

test('intervalos atravessam meses e anos, validam dias e não aceitam futuro',()=>{
  const now=new Date('2026-11-06T12:00:00Z');
  const filters={...filtrosIniciais,modo:'INTERVALO',inicio:'31/12/2024',fim:'02/01/2026'};
  assert.deepEqual(parametrosTemporaisCompras(filters,now),{inicio:'2024-12-31',fim:'2026-01-02'});
  assert.deepEqual(parametrosTemporaisCompras({...filters,inicio:'29/02/2024',fim:'29/02/2024'},now),{inicio:'2024-02-29',fim:'2024-02-29'});
  assert.throws(()=>parametrosTemporaisCompras({...filters,inicio:'29/02/2025'},now));
  assert.throws(()=>parametrosTemporaisCompras({...filters,inicio:'03/01/2026'},now));
  assert.throws(()=>parametrosTemporaisCompras({...filters,fim:'07/11/2026'},now));
  assert.throws(()=>parametrosTemporaisCompras({...filters,modo:'MES',mes:'2026-12'},now));
});

test('seletor temporal navega anos inline e valida intervalo antes de atualizar a lista',async()=>{
  const calls=[],h=createRenderer();
  const text=node=>typeof node==='string'?node:node?.props?.children?.map(text).join('')||'';
  const Component=h.load('src/components/PurchaseComponents/FiltroTemporalCompras.js').default;
  const filters={...filtrosIniciais,modo:'MES',mes:'2026-01',inicio:'03/10/2026',fim:'02/10/2026'};
  h.mount(Component,{filtros:filters,inicioHistorico:'2024-01-15',onChange:next=>calls.push(next)});await h.flush();
  const pressLabel=label=>{const button=h.nodes(node=>node.props.accessibilityLabel===label)[0];assert.ok(button,label);button.props.onPress();};
  const press=textValue=>{const button=h.nodes(node=>['Pressable','TouchableOpacity'].includes(node.type)&&text(node)===textValue)[0];assert.ok(button,textValue);button.props.onPress();};
  pressLabel('Mês anterior');await h.flush();assert.equal(calls[0].mes,'2025-12');
  pressLabel('Escolher mês e ano');await h.flush();
  assert.equal(h.nodes(node=>node.type==='Modal').length,0);
  pressLabel('Ano anterior');await h.flush();press('Concluir');await h.flush();
  assert.equal(calls.at(-1).mes,'2025-01');
  press('Período');await h.flush();press('Aplicar período');await h.flush();
  assert.ok(h.nodes(node=>node.props.accessibilityRole==='alert').length);
  const before=calls.length;
  pressLabel('Data final');await h.flush();pressLabel('04/10/2026');await h.flush();
  assert.equal(calls.length,before);
  press('Aplicar período');await h.flush();
  assert.equal(calls.at(-1).inicio,'03/10/2026');assert.equal(calls.at(-1).fim,'04/10/2026');
  h.unmount();
});
