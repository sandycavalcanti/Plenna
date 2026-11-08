export function validarUsoContextual(d,periodo) {
  if(d?.versaoContrato!==1||d.periodo!==periodo||!['PARCIAL','SEM_DADOS','SEM_AUTORIZACAO','INDISPONIVEL'].includes(d.disponibilidade)||
    !Number.isSafeInteger(d.diasComDados)||d.diasComDados<0||d.diasComDados>31||
    (d.diasComDados>0)!==(d.minutosRegistrados!==null)||
    !(d.minutosRegistrados===null||Number.isFinite(d.minutosRegistrados)&&d.minutosRegistrados>=0)||
    d.cobertura!=='PARCIAL_OU_DESCONHECIDA'||d.associacaoComCompra!=='INDISPONIVEL'||d.referenciaTemporal!=='DIAS_LOCAIS_DA_FONTE_RF017'||
    (d.disponibilidade!=='PARCIAL'||!d.diasComDados)&&(d.minutosRegistrados!==null||d.diasComDados!==0))throw Error('INVALID_USAGE_CONTEXT');
  return d;
}
export function criarConsultaUsoContextual({periodo,client,storage,onChange,emAlteracao=()=>false}) {
  let generation=0,disposed=false,controller,session,detach=()=>{};
  const emit=value=>{if(!disposed)onChange(value);};
  const invalidar=()=>{generation++;controller?.abort();};
  const q={async consultar(){
    invalidar();const id=generation;controller=new AbortController();const signal=controller.signal;emit({status:'loading',dados:null});
    try{
      const captured=session??await storage.captureSession();if(disposed||id!==generation)return;
      if(!captured||captured.signal.aborted)throw Error('SESSION');
      if(!session){session=captured;const lost=()=>{invalidar();emit({status:'session',dados:null});};session.signal.addEventListener('abort',lost,{once:true});detach=()=>session.signal.removeEventListener('abort',lost);}
      storage.assertSession(session.id);if(emAlteracao(session.id))throw Error('CONSENT');
      const response=await client.get('/analises/uso-contextual',{params:{periodo},signal,usageMonitoringSessionId:session.id,timeout:15000});
      if(disposed||id!==generation||signal.aborted)return;
      storage.assertSession(session.id);if(emAlteracao(session.id))throw Error('CONSENT');
      emit({status:'ready',dados:validarUsoContextual(response.data,periodo),consultadoEm:new Date().toISOString()});
    }catch(e){if(!disposed&&id===generation)emit({status:e.message==='CONSENT'?'consent':e.message==='SESSION'?'session':'error',dados:null});}
  },consentimentoAlterado(id,details){
    if(session&&session.id!==id)return;
    invalidar();emit({status:'consent',dados:null});
    if(details?.confirmed&&details.status===true)q.consultar();
  },dispose(){disposed=true;invalidar();detach();}};
  return q;
}
