import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parametrosTemporaisCompras,filtrosIniciais} from '../src/utils/filtrosHistoricoCompras.js';
import {comprasPeriodo} from '../src/utils/comprasPeriodo.js';
const source=await readFile(new URL('../src/pages/PurchasesScreen/index.js',import.meta.url),'utf8');
const start=source.indexOf('  const loadPurchases = useCallback(');
const code=source.slice(start,source.indexOf('  /**',start));
function harness() {
  const session=new AbortController(),pending=[], state={panoramaRevision:0}, refs=[{current:0},{current:null},{current:()=>{}}];
  const storage={captureSession:async()=>({id:1,signal:session.signal}),assertSession:()=>{if(session.signal.aborted)throw Error('SESSION');}};
  const client={get:(_url,config)=>new Promise((resolve,reject)=>pending.push({resolve,reject,config}))};
  const cursorRef={current:null};
  const setter=key=>value=>{state[key]=typeof value==='function'?value(state[key]??(key==='rows'?[]:{})):value;};
  const load=periodo=>new Function('useCallback','isFocused','protectedAccess','PROTECTED_ACCESS_STATES','purchaseRequest','purchaseAbort','purchaseSessionDetach',
    'setRefreshing','setLoading','setErrorMessage','setOperationFeedback','tokenStorage','apiClient','setPurchases','setResumos','setContextoCompraId','setGerenciamento',
    'cursorRef','setNextCursor','parametrosTemporaisCompras','filtros','consultarResumosCompras','filtroConsumo','comprasPeriodo','sortPurchases','logApiErrors','setPanoramaRevision',code+';return loadPurchases;')(
    fn=>fn,true,{status:'UNLOCKED'},{UNLOCKED:'UNLOCKED'},...refs,setter('refreshing'),setter('loading'),setter('error'),setter('operationFeedback'),storage,client,
    setter('rows'),setter('summaries'),setter('context'),setter('management'),cursorRef,setter('next'),parametrosTemporaisCompras,{...filtrosIniciais,...(periodo?{modo:'MES',mes:periodo}:{})},async()=>({}),periodo?{periodo}:null,comprasPeriodo,rows=>rows,()=>{},setter('panoramaRevision'));
  return {load,pending,state,session};
}
const page=(compras,proximoCursor=null)=>({compras,proximoCursor});
const purchase=(id,month)=>({compra_id:id,compra_status:'CONFIRMADA',compra_ativo:1,compra_horario:`${month}-02T12:00:00Z`});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('F03: resposta atrasada não substitui o filtro mais recente de compras',async()=>{
  const h=harness();const first=h.load('2026-09')();await tick();
  const second=h.load('2026-10')();await tick();
  assert.equal(h.pending[0].config.signal.aborted,true);
  h.pending[1].resolve({data:page([purchase(2,'2026-10')])});await second;
  h.pending[0].resolve({data:page([purchase(1,'2026-09')])});await first;
  assert.deepEqual(h.state.rows.map(row=>row.compra_id),[2]);assert.equal(h.state.loading,false);
});
test('F03: logout remove dados já carregados e invalida respostas pendentes',async()=>{
  const h=harness();const request=h.load()();await tick();h.pending[0].resolve({data:page([purchase(1,'2026-10')])});await request;
  assert.equal(h.state.rows.length,1);h.session.abort();assert.deepEqual(h.state.rows,[]);assert.match(h.state.error,/sessão mudou/);
  const another=harness();const late=another.load()();await tick();another.session.abort();
  another.pending[0].resolve({data:page([purchase(2,'2026-10')])});await late;assert.deepEqual(another.state.rows,[]);
});
test('F30: lista inválida é erro, enquanto lista vazia válida permanece vazia',async()=>{
  for(const data of [{unexpected:true},[]]) {
    const h=harness();const request=h.load()();await tick();h.pending[0].resolve({data:Array.isArray(data)?page(data):data});await request;
    if(Array.isArray(data)){assert.deepEqual(h.state.rows,[]);assert.equal(h.state.error,null);}
    else assert.match(h.state.error,/Não foi possível carregar/);
  }
});

test('histórico padrão não envia mês e pagina sem substituir compras anteriores',async()=>{
  const h=harness(),load=h.load();const first=load();await tick();
  assert.deepEqual(h.pending[0].config.params,parametrosTemporaisCompras(filtrosIniciais));
  h.pending[0].resolve({data:page([purchase(2,'2026-10')],2)});await first;
  const more=load(false,true);await tick();assert.equal(h.pending[1].config.params.antes,2);
  h.pending[1].resolve({data:page([purchase(1,'2026-09')])});await more;
  assert.deepEqual(h.state.rows.map(row=>row.compra_id),[2,1]);assert.equal(h.state.next,null);
  assert.equal(h.state.panoramaRevision,1); // Paginação não invalida o agregado do período.
});

test('histórico completo mantém mais de 50 registros e alcança compras retroativas antigas',async()=>{
  const h=harness(),load=h.load();
  const first=load();await tick();
  h.pending[0].resolve({data:page(Array.from({length:50},(_,i)=>purchase(100-i,'2026-10')),51)});await first;
  const more=load(false,true);await tick();
  h.pending[1].resolve({data:page([purchase(1,'2001-09')])});await more;
  assert.equal(h.state.rows.length,51);
  assert.equal(h.state.rows.at(-1).compra_horario,'2001-09-02T12:00:00Z');
  assert.equal(h.state.next,null);
});

test('trocar mês reinicia cursor, limpa resultados antigos e aceita período vazio',async()=>{
  const h=harness();let request=h.load('2026-09')();await tick();
  h.pending[0].resolve({data:page([purchase(9,'2026-09')],9)});await request;
  request=h.load('2026-10')();await tick();
  assert.deepEqual(h.state.rows,[]);assert.equal(h.state.next,null);
  assert.deepEqual(h.pending[1].config.params,{mes:'2026-10'});
  h.pending[1].resolve({data:page([])});await request;
  assert.deepEqual(h.state.rows,[]);assert.equal(h.state.error,null);
});

test('falha ao carregar próxima página preserva lista e permite repetir o mesmo cursor',async()=>{
  const h=harness(),load=h.load();let request=load();await tick();
  h.pending[0].resolve({data:page([purchase(9,'2026-10')],9)});await request;
  request=load(false,true);await tick();h.pending[1].reject(Error('offline'));await request;
  assert.equal(h.state.rows.length,1);assert.equal(h.state.next,9);assert.ok(h.state.error);
  request=load(false,true);await tick();assert.equal(h.pending[2].config.params.antes,9);
  h.pending[2].resolve({data:page([purchase(9,'2026-10'),purchase(8,'2026-09')])});await request;
  assert.deepEqual(h.state.rows.map(row=>row.compra_id),[9,8]);assert.equal(h.state.error,null);
});
