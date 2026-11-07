import {parametrosTemporaisCompras} from '../utils/filtrosHistoricoCompras.js';

export const SINAIS_PANORAMA={PLANEJADA:'Planejamento completo',PARCIAL:'Planejamento parcial',NAO_PLANEJADA:'Sem planejamento declarado',
  PROMOCAO:'Promoção',NECESSIDADE:'Necessidade inesperada',ANTECIPADA:'Antecipação',ADIADA:'Adiamento',
  IMPULSO:'Percepção de impulso (declarada)',SEM_IMPULSO:'Sem percepção de impulso (declarada)',
  CLASSIFICADA_IMPULSIVA:'Classificação registrada: impulsiva',CLASSIFICADA_NAO_IMPULSIVA:'Classificação registrada: não impulsiva'};
export const RELACOES_PANORAMA={PROMOCAO_ANTECIPACAO:'Promoção e antecipação',PROMOCAO_IMPULSO:'Promoção e percepção de impulso',
  PARCIAL_ITENS:'Planejamento parcial e itens não planejados',NECESSIDADE_SEM_PLANO:'Necessidade inesperada e ausência de planejamento'};
export function parametrosPanorama(filtros) {
  const params=parametrosTemporaisCompras(filtros);
  return filtros.modo==='TODOS'?{}:params;
}
const inteiro=v=>Number.isSafeInteger(v)&&v>=0;
const data=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const diaSP=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const forma=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export function validarComportamentoPanorama(v,periodo,universo) {
  const r=v?.recorrencias,c=v?.comparacao;
  const textos=a=>Array.isArray(a)&&a.length<=8&&a.every(t=>typeof t==='string'&&t.length>0);
  if(!forma(v,['versaoContrato','recorrencias','comparacao','limitacoes'])||v.versaoContrato!==1||!textos(v.limitacoes)||
    !forma(r,['origem','comprasVinculadas','vinculosDistintos','cobertura'])||r.origem!=='VINCULOS_REGISTRADOS'||r.cobertura!=='REGISTROS_DISPONIVEIS'||
    !inteiro(r.comprasVinculadas)||!inteiro(r.vinculosDistintos)||r.comprasVinculadas>universo||r.vinculosDistintos>r.comprasVinculadas||
    (r.comprasVinculadas===0)!==(r.vinculosDistintos===0)||
    !forma(c,['disponibilidade','motivos','atual','anterior','frequencia','medianaCentavos'])||!textos(c.motivos)||!['DISPONIVEL','INDISPONIVEL'].includes(c.disponibilidade))throw Error('INVALID_PANORAMA_BEHAVIOR');
  const janela=j=>forma(j,['inicio','fimExclusivo'])&&data(j.inicio)&&data(j.fimExclusivo)&&Date.parse(j.inicio)<Date.parse(j.fimExclusivo);
  if((c.atual===null)!==(c.anterior===null)||c.atual!==null&&(!janela(c.atual)||!janela(c.anterior)||periodo.modo!=='MES'||
    Date.parse(c.atual.inicio)!==Date.parse(periodo.inicio)||Date.parse(c.atual.fimExclusivo)>Date.parse(periodo.observadoAte)||
    Date.parse(c.anterior.fimExclusivo)>Date.parse(c.atual.inicio)||
    Date.parse(c.atual.fimExclusivo)-Date.parse(c.atual.inicio)!==Date.parse(c.anterior.fimExclusivo)-Date.parse(c.anterior.inicio)))throw Error('INVALID_PANORAMA_BEHAVIOR');
  if(c.disponibilidade==='INDISPONIVEL') {
    if(!c.motivos.length||c.frequencia!==null||c.medianaCentavos!==null)throw Error('INVALID_PANORAMA_BEHAVIOR');
  } else {
    const f=c.frequencia,m=c.medianaCentavos;
    if(!c.atual||!c.anterior||!forma(f,['atual','anterior','diferenca'])||![f.atual,f.anterior].every(inteiro)||f.atual>universo||
      !Number.isSafeInteger(f.diferenca)||f.diferenca!==f.atual-f.anterior||m===null&&!c.motivos.length)throw Error('INVALID_PANORAMA_BEHAVIOR');
    const meioCentavo=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=Number.MAX_SAFE_INTEGER&&Number.isInteger(n*2);
    if(m!==null&&(!forma(m,['atual','anterior','diferenca'])||![m.atual,m.anterior,m.diferenca].every(meioCentavo)||m.atual<0||m.anterior<0||
      m.diferenca!==m.atual-m.anterior||f.atual===0||f.anterior<2))throw Error('INVALID_PANORAMA_BEHAVIOR');
  }
  return v;
}
export function validarPanorama(d,params,detalhes,comportamento=false) {
  const p=d?.periodo;
  const modo=params.mes?'MES':params.inicio?'INTERVALO':'TODOS';
  const validoIndicador=(s,origem)=>s&&inteiro(s.validos)&&inteiro(s.condicao)&&s.condicao<=s.validos&&s.validos<=d.universo&&
    s.universo===d.universo&&s.origem===origem&&s.disponibilidade===(s.validos?'DISPONIVEL':'SEM_DADOS')&&
    s.proporcao===(s.validos?s.condicao/s.validos:null);
  if(d?.versaoContrato!==1||p?.modo!==modo||p.timezone!=='America/Sao_Paulo'||!data(p.fimExclusivo)||!data(p.observadoAte)||
    Date.parse(p.observadoAte)>Date.parse(p.fimExclusivo)||p.inicio!==null&&(!data(p.inicio)||Date.parse(p.inicio)>Date.parse(p.observadoAte))||
    params.mes&&(p.mes!==params.mes||diaSP(p.inicio)!==params.mes+'-01')||
    params.inicio&&(diaSP(p.inicio)!==params.inicio||diaSP(new Date(Date.parse(p.fimExclusivo)-1))!==params.fim)||
    modo==='TODOS'&&p.inicio!==null||
    ![d.universo,d.comContexto,d.comAutopercepcao].every(inteiro)||d.comContexto>d.universo||d.comAutopercepcao>d.comContexto||
    d.disponibilidade!==(d.universo?'DISPONIVEL':'SEM_DADOS')||typeof d.reflexao!=='string'||
    !Array.isArray(d.limitacoes)||!d.limitacoes.every(v=>typeof v==='string'))throw Error('INVALID_PANORAMA');
  if(detalhes) {
    const h=d.habitos;
    if(!Array.isArray(d.sinais)||d.sinais.length>11||new Set(d.sinais.map(s=>s.codigo)).size!==d.sinais.length||
      d.sinais.some(s=>!SINAIS_PANORAMA[s.codigo]||!validoIndicador(s,s.codigo.startsWith('CLASSIFICADA_')?'CLASSIFICACAO_REGISTRADA':'RESPOSTA_VOLUNTARIA'))||
      !Array.isArray(d.relacoes)||d.relacoes.length>4||new Set(d.relacoes.map(s=>s.codigo)).size!==d.relacoes.length||
      d.relacoes.some(s=>!RELACOES_PANORAMA[s.codigo]||!validoIndicador(s,'RESPOSTAS_NA_MESMA_COMPRA'))||
      h?.origem!=='COMPRAS_REGISTRADAS'||![h.categoriasValidas,h.valoresValidos,h.totalCentavos].every(inteiro)||
      h.categoriasValidas>d.universo||h.valoresValidos>d.universo||
      !Array.isArray(h.categorias)||h.categorias.length>5||h.categorias.some(c=>typeof c.nome!=='string'||!inteiro(c.compras)||c.compras>h.categoriasValidas)||
      !Array.isArray(h.diasSemana)||h.diasSemana.length>7||new Set(h.diasSemana.map(v=>v.dia)).size!==h.diasSemana.length||
      h.diasSemana.some(v=>!inteiro(v.dia)||v.dia>6||!inteiro(v.compras))||h.diasSemana.reduce((s,v)=>s+v.compras,0)!==d.universo||
      h.comparacao?.disponibilidade!=='INDISPONIVEL')throw Error('INVALID_PANORAMA');
  }
  if(comportamento)validarComportamentoPanorama(d.comportamento,p,d.universo);
  return d;
}

// No persistent cache. Each read is bound to a session and period generation.
export function criarConsultaPanorama({filtros,client,storage,onChange}) {
  let disposed=false,generation=0,controller,session,detach=()=>{};
  const emit=s=>{if(!disposed)onChange(s);};
  const invalidar=()=>{generation++;controller?.abort();emit({status:'idle',dados:null});};
  const lost=()=>{invalidar();emit({status:'session',dados:null});};
  return {invalidar,async consultar(detalhes=false,comportamento=false) {
    invalidar();const id=generation;controller=new AbortController();const signal=controller.signal;
    emit({status:'loading',dados:null});
    try {
      const params=parametrosPanorama(filtros);
      const captured=session??await storage.captureSession();
      if(disposed||id!==generation)return;
      if(!captured||captured.signal.aborted)throw Error('SESSION_REQUIRED');
      if(!session){session=captured;session.signal.addEventListener('abort',lost,{once:true});detach=()=>session.signal.removeEventListener('abort',lost);}
      storage.assertSession(session.id);
      const response=await client.get('/analises/panorama',{params:{...params,detalhes:detalhes?'1':'0',...(comportamento?{comportamento:'1'}:{})},signal,usageMonitoringSessionId:session.id,timeout:15000});
      if(disposed||id!==generation||signal.aborted)return;
      storage.assertSession(session.id);
      const dados=validarPanorama(response.data,params,detalhes,comportamento);
      emit({status:'ready',dados,consultadoEm:new Date().toISOString()});
    } catch(error) {if(!disposed&&id===generation)emit({status:error.message==='SESSION_REQUIRED'?'session':'error',dados:null});}
  },dispose(){disposed=true;invalidar();detach();}};
}
