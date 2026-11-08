import test from 'node:test';
import assert from 'node:assert/strict';
import {parametrosHistorico,filtrosIniciais,dataCivilInput} from '../src/utils/filtrosHistoricoCompras.js';
import {createRenderer} from './helpers/componentRenderer.mjs';
const native={View:'View',Text:'Text',TextInput:'TextInput',Modal:'Modal',ScrollView:'ScrollView',Pressable:'Pressable',StyleSheet:{create:value=>value}};
test('período e status são independentes; intervalo mantém dias civis válidos',()=>{
  assert.deepEqual(parametrosHistorico(filtrosIniciais),{});
  assert.deepEqual(parametrosHistorico({...filtrosIniciais,modo:'MES',mes:'2026-09',status:'IGNORADA'}),{mes:'2026-09',status:'IGNORADA'});
  assert.deepEqual(parametrosHistorico({...filtrosIniciais,modo:'INTERVALO',inicio:'30/09/2026',fim:'01/10/2026'}),{inicio:'2026-09-30',fim:'2026-10-01'});
  assert.equal(dataCivilInput('30/02/2026'),null);
  assert.throws(()=>parametrosHistorico({...filtrosIniciais,modo:'INTERVALO',inicio:'02/10/2026',fim:'01/10/2026'}));
});
test('filtro de privacidade fica no formulário; só aplicar transmite a escolha',async()=>{
  const calls=[],h=createRenderer({'react-native':native});
  const text=node=>typeof node==='string'?node:node?.props?.children?.map(text).join('')||'';
  const Component=h.load('src/components/PurchaseComponents/FiltrosHistorico.js').default;
  h.mount(Component,{filtros:filtrosIniciais,ocultas:false,onApply:(...args)=>calls.push(args),onClose:()=>{}});
  const press=label=>h.nodes(node=>node.type==='Pressable'&&text(node)===label)[0].props.onPress();
  press('Compras ocultas');await h.flush();assert.equal(calls.length,0);
  press('Aplicar filtros');assert.equal(calls[0][1],true);h.unmount();
});
