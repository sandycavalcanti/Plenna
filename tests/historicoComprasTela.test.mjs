import test from 'node:test';
import assert from 'node:assert/strict';
import {filtrosTemporaisIniciais,parametrosTemporaisCompras,filtrosIniciais} from '../src/utils/filtrosHistoricoCompras.js';
import {createRenderer} from './helpers/componentRenderer.mjs';
const text=node=>typeof node==='string'||typeof node==='number'?String(node):node?.props?.children?.map(text).join('')||'';
test('histórico não oferece controle de ocultas e mantém compras ocultas fora da listagem',async()=>{
  let h;const requests=[],auth=[],shown=[],session=new AbortController();
  const gate={status:'unlocked',beginAccess:options=>auth.push(options),cancelAccess:()=>{gate.status='locked';},lifecycleRevision:0};
  const native=Object.fromEntries(['View','Text','Pressable','TouchableOpacity','ScrollView','ActivityIndicator','TextInput','Modal'].map(name=>[name,name]));
  Object.assign(native,{StyleSheet:{create:value=>value},AppState:{addEventListener:()=>({remove(){}})},
    useWindowDimensions:()=>({width:320}),Animated:{Value:class{interpolate(){return 0;}},View:'View',event:()=>()=>{}},
    FlatList:props=>({type:'View',props:{children:[props.ListHeaderComponent,...(props.data||[]).map((item,index)=>props.renderItem({item,index})),props.ListFooterComponent]}})});
  native.Animated.FlatList=native.FlatList;
  const rows=[1,2].map(compra_id=>({compra_id,compra_status:'CONFIRMADA',compra_ativo:1,compra_horario:'2026-09-02T12:00:00Z'}));
  h=createRenderer({
    'react-native':native,
    '@react-navigation/native':{useNavigation:()=>({navigate(){},setParams(){}}),useIsFocused:()=>true,useFocusEffect:callback=>h.React.useEffect(callback,[callback])},
    '../../hooks/useProtectedAccess':{PROTECTED_ACCESS_STATES:{UNLOCKED:'unlocked',LOCKED:'locked'},useProtectedAccess:()=>gate},
    '../../api/client':{apiClient:{get:async(url,config)=>{requests.push({url,params:config.params});return {data:url==='/users/user'?{usuario_data_criacao:'2026-09-01T12:00:00Z'}:{compras:rows,proximoCursor:null}};}}},
    '../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:1,signal:session.signal}),assertSession:()=>{if(session.signal.aborted)throw Error('SESSION');}}},
    '../../services/resumosCompras':{consultarResumosCompras:async()=>({1:{oculto:false},2:{oculto:true}})},
    '../../components/PurchaseComponents/PurchaseItem':{__esModule:true,default:props=>{shown.push(props.purchase.compra_id);return {type:'Text',props:{children:[`Compra ${props.purchase.compra_id}`]}};}},
    '../../components/PurchaseComponents/ContextoCompra':{__esModule:true,default:()=>null},
    '../../components/PurchaseComponents/GerenciarCompra':{__esModule:true,default:()=>null},
    '../../components/SecurityComponents/PinModal':{__esModule:true,default:()=>null},
  });
  h.mount(h.load('src/pages/PurchasesScreen/index.js').default,{});await h.flush();await h.flush();
  assert.deepEqual(requests.find(r=>r.url==='/compras/historico').params,parametrosTemporaisCompras(filtrosTemporaisIniciais()));
  assert.ok(shown.includes(1),JSON.stringify(h.nodes(node=>node.type==='Text').map(text)));assert.ok(!shown.includes(2));
  assert.equal(h.nodes(node=>node.props.accessibilityLabel==='Buscar estabelecimento').length,0);
  assert.equal(h.nodes(node=>node.props.accessibilityRole==='tab').length,0);
  const press=label=>{const button=h.nodes(node=>node.type==='Pressable'&&text(node)===label)[0];assert.ok(button,label);button.props.onPress();};
  press('Todo o histórico');await h.flush();await h.flush();
  assert.deepEqual(requests.filter(r=>r.url==='/compras/historico').at(-1).params,parametrosTemporaisCompras(filtrosIniciais));
  assert.ok(h.nodes(node=>node.type==='Text'&&text(node).startsWith('Conta criada em 01/09/2026.')).length);
  assert.ok(h.nodes(node=>node.type==='Text'&&text(node).includes('incluindo compras importadas anteriores à conta')).length);
  assert.equal(h.nodes(node=>node.props.accessibilityLabel==='Mostrar compras ocultas').length,0);
  assert.ok(!shown.includes(2));
  press('Mês');await h.flush();await h.flush();
  assert.ok(!shown.includes(2));
  h.nodes(node=>node.props.accessibilityLabel==='Atualizar compras')[0].props.onPress();await h.flush();await h.flush();
  assert.ok(!shown.includes(2));
  session.abort();await h.flush();assert.equal(h.nodes(node=>node.type==='Text'&&text(node)==='Compra 1').length,0);
  h.unmount();
});

test('compra ignorada é identificada no histórico e não oferece operações financeiras',async()=>{
 const h=createRenderer();
 const Card=h.load('src/components/PurchaseComponents/PurchaseItem/index.js').default;
 h.mount(Card,{purchase:{compra_id:3,compra_status:'IGNORADA',compra_classificacao:'PENDENTE',compra_valor:10,
   compra_horario:'2026-09-02T12:00:00Z',tb_compra_item:[{compra_item_id:1,compra_item_nome:'Item',compra_item_ativo:1,compra_item_valor:10}]},onManage:()=>{throw Error('UNEXPECTED_MUTATION');}});
 h.nodes(node=>node.props.accessibilityLabel==='Ver itens da compra')[0].props.onPress();await h.flush();
 assert.ok(h.nodes(node=>node.type==='Text'&&text(node)==='Ignorada').length);
 assert.equal(h.nodes(node=>/Gerenciar|Excluir/.test(node.props.accessibilityLabel||'')).length,0);
 h.unmount();
});

test('card compacto expande somente itens visíveis e preserva o gerenciamento existente',async()=>{
 const calls=[],h=createRenderer();const Card=h.load('src/components/PurchaseComponents/PurchaseItem/index.js').default;
 h.mount(Card,{purchase:{compra_id:4,compra_status:'CONFIRMADA',compra_classificacao:'PENDENTE',compra_valor:20,
   compra_horario:'2026-10-01T02:30:00Z',tb_compra_item:[1,2].map(compra_item_id=>({compra_item_id,compra_item_nome:compra_item_id===1?'Visível':'Oculto',compra_item_ativo:1,compra_item_valor:10}))},
   resumo:{itensOcultos:[2]},onManage:(_purchase,item)=>calls.push(item?.compra_item_id)});
 assert.equal(h.nodes(node=>node.type==='Text'&&text(node)==='Visível').length,0);
 assert.ok(h.nodes(node=>node.type==='Text'&&text(node)==='30/09/2026').length);
 h.nodes(node=>node.props.accessibilityLabel==='Ver itens da compra')[0].props.onPress();await h.flush();
 assert.ok(h.nodes(node=>node.type==='Text'&&text(node)==='Visível').length);
 assert.equal(h.nodes(node=>node.type==='Text'&&text(node)==='Oculto').length,0);
 h.nodes(node=>node.props.accessibilityLabel==='Gerenciar item Visível')[0].props.onPress();assert.deepEqual(calls,[1]);h.unmount();
});
