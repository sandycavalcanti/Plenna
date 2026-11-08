import test from 'node:test';
import assert from 'node:assert/strict';
import {criarConsultaUsoContextual,validarUsoContextual} from '../src/services/usoContextualService.js';
import {createRenderer} from './helpers/componentRenderer.mjs';
const periodo='2026-10';
const dados={versaoContrato:1,periodo,disponibilidade:'PARCIAL',diasComDados:2,minutosRegistrados:30,cobertura:'PARCIAL_OU_DESCONHECIDA',referenciaTemporal:'DIAS_LOCAIS_DA_FONTE_RF017',associacaoComCompra:'INDISPONIVEL'};
const tick=()=>new Promise(r=>setImmediate(r));
test('contrato digital mantém cobertura parcial e não aceita mistura de período, contagem ou associação',()=>{
  assert.equal(validarUsoContextual(dados,periodo).minutosRegistrados,30);
  for(const patch of [{periodo:'2026-11'},{diasComDados:32},{minutosRegistrados:-1},{minutosRegistrados:null},{disponibilidade:'SEM_AUTORIZACAO'},{associacaoComCompra:'COMPROVADA'}])assert.throws(()=>validarUsoContextual({...dados,...patch},periodo));
  assert.equal(validarUsoContextual({...dados,disponibilidade:'SEM_AUTORIZACAO',diasComDados:0,minutosRegistrados:null},periodo).minutosRegistrados,null);
});
test('revogação descarta resposta atrasada e sessão revogada não mantém dados ou horário',async()=>{
  const abort=new AbortController(),states=[],pending=[];
  const q=criarConsultaUsoContextual({periodo,client:{get:()=>new Promise(r=>pending.push(r))},storage:{captureSession:async()=>({id:7,signal:abort.signal}),assertSession:()=>{if(abort.signal.aborted)throw Error('SESSION');}},onChange:s=>states.push(s)});
  const a=q.consultar();await tick();q.consentimentoAlterado(7);pending[0]({data:dados});await a;assert.equal(states.at(-1).status,'consent');assert.equal(states.at(-1).dados,null);
  const b=q.consultar();await tick();pending[1]({data:dados});await b;assert.equal(states.at(-1).status,'ready');assert.ok(states.at(-1).consultadoEm);
  q.consentimentoAlterado(8);assert.equal(states.at(-1).status,'ready');abort.abort();assert.equal(states.at(-1).dados,null);assert.equal(states.at(-1).consultadoEm,undefined);q.dispose();
});
test('consentimento em alteração impede consulta; falha digital é independente das compras',async()=>{
  const abort=new AbortController(),states=[];let calls=0;
  const q=criarConsultaUsoContextual({periodo,emAlteracao:()=>true,client:{get:async()=>{calls++;throw Error('offline');}},storage:{captureSession:async()=>({id:7,signal:abort.signal}),assertSession(){}},onChange:s=>states.push(s)});
  await q.consultar();assert.equal(calls,0);assert.equal(states.at(-1).status,'consent');q.dispose();
});
test('leitura digital é sob demanda e mostra autorização, sem aplicativo, identificador ou causalidade',async()=>{
  let calls=0;
  const abort=new AbortController();const h=createRenderer({'../../../api/client':{apiClient:{get:async()=>{calls++;return {data:dados};}}},'../../../api/tokenStorage':{tokenStorage:{captureSession:async()=>({id:7,signal:abort.signal}),assertSession(){}}},'../../../api/consentimento':{monitoramentoEmAlteracao:()=>false,observarAlteracaoMonitoramento:()=>()=>{}}});
  h.mount(h.load('src/components/PurchaseComponents/PanoramaCompras/UsoDigitalPeriodo.js').default,{periodo});await h.flush();assert.equal(calls,0);
  h.nodes(n=>n.type==='Pressable')[0].props.onPress();await h.flush();assert.equal(calls,1);
  const text=n=>typeof n==='string'||typeof n==='number'?String(n):n?.props?.children?.map(text).join('')||'';
  const displayed=h.nodes(n=>n.type==='Text').map(text).join(' ');assert.match(displayed,/30 min/);assert.match(displayed,/Com registros/);assert.doesNotMatch(displayed,/RF017/);
  h.nodes(n=>n.props.accessibilityLabel==='Detalhes do uso digital')[0].props.onPress();await h.flush();
  const details=h.nodes(n=>n.type==='Text').map(text).join(' ');
  assert.match(details,/Cobertura parcial/);assert.match(details,/Não indica/);assert.equal(calls,1);h.unmount();
});
