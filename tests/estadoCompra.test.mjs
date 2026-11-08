import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from './helpers/componentRenderer.mjs';

test('F24: eventos vazios, falha, contrato inválido e sessão revogada permanecem distintos', async () => {
  for (const kind of ['empty', 'network', 'invalid']) {
    const controller = new AbortController();let latest;
    const data = {versaoContrato:1,compraId:7,disponivel:true,eventos:[],resumo:{reembolsadoCentavos:0}};
    const h = createRenderer({
      '../api/client': {apiClient:{get:async()=>{if(kind==='network')throw Error('offline');return {data:kind==='invalid'?{...data,compraId:8}:data};}}},
      '../api/tokenStorage': {tokenStorage:{captureSession:async()=>({id:1,signal:controller.signal}),
        assertSession:()=>{if(controller.signal.aborted)throw Error('session');}}},
    });
    const hook=h.load('src/hooks/useEstadoCompra.js').useEstadoCompra;
    h.mount(()=>{latest=hook(7,0);return null;});await h.flush();
    assert.equal(latest.loading,false);assert.equal(latest.error,kind!=='empty');
    assert.equal(latest.data?.eventos.length,kind==='empty'?0:undefined);
    controller.abort();await h.flush();assert.equal(latest.data,null);
    h.unmount();
  }
});
