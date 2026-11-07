// Dependency-injected orchestration. No storage, network or native work at import time.
export function buildUsageWindows(association, serverTime, timezone) {
  if(association.timezone!==timezone)throw new Error('TIMEZONE_VALIDATION_REQUIRED');
  const now=new Date(serverTime),windows=[];
  for(let back=0;back<=2;back++){
    const day=new Date(now.getFullYear(),now.getMonth(),now.getDate()-back);
    const next=new Date(day.getFullYear(),day.getMonth(),day.getDate()+1);
    const start=Math.max(day.getTime(),Date.parse(association.eligibleFrom));
    const end=Math.min(next.getTime(),now.getTime());
    if(start>=end)continue;
    windows.push({start,end,localDate:`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`,
      dayExtent:start===day.getTime()&&end===next.getTime()?'WHOLE_DAY':'PARTIAL_DAY'});
  }
  return windows;
}
export function createUsageSnapshotEngine(d){
  let pending=null,pendingSession=null,runningActivation=false,controller=null,uncertain=null;
  const stop=()=>{controller?.abort();uncertain=null;};
  async function run({activate=false,expectedSessionId}={}){
    const session=await d.session();if(!session)throw new Error('SESSION_REQUIRED');
    if(expectedSessionId!==undefined&&session.id!==expectedSessionId)throw new Error('SESSION_INVALIDATED');
    while(pending){if(pendingSession===session.id&&!controller?.signal.aborted&&(!activate||runningActivation))return pending;await pending.catch(()=>{});d.assertSession(session.id);}
    pendingSession=session.id;runningActivation=activate;
    pending=execute(activate,session).finally(()=>{pending=null;pendingSession=null;controller=null;});return pending;
  }
  async function execute(activate,session){
    let stage='PREPARATION';
    const enter=value=>{stage=value;d.diagnostic?.(stage,'START');};
    controller=new AbortController();const local=controller;
    const abort=()=>{local.abort();uncertain=null;};session.signal.addEventListener('abort',abort);
    const guard=()=>{d.assertSession(session.id);if(local.signal.aborted||session.signal.aborted||!d.active())throw new Error('OPERATION_CANCELLED');};
    const checked=async promise=>{guard();const result=await promise;guard();d.diagnostic?.(stage,'OK');return result;};
    try{
      enter('CONSENT');guard();if(d.consent&&!await checked(d.consent(session,local.signal)))throw new Error('CONSENT_REQUIRED');
      enter('PERMISSION');
      if(!await checked(d.permission()))throw new Error('USAGE_ACCESS_REQUIRED');
      enter('IDENTITY');
      const identity=await checked(d.identity());
      enter('STATE');
      let state;
      try{state=await checked(d.state(identity,session,local.signal));}
      catch(error){if(!activate||error?.response?.data?.error?.code!=='INSTALLATION_NOT_FOUND')throw error;state={association:null};}
      if(state.consentActive===false)throw new Error('CONSENT_REQUIRED');
      if(identity.needsNewEpisode&&state.association){await checked(d.close(state.association.id,identity,session,local.signal));state.association=null;}
      const request={schemaVersion:2,operationId:d.uuid(),installationId:identity.id,expectedAssociationId:state.association?.id??null,
        timezone:d.timezone(),action:activate?'ACTIVATE':'RESUME'};
      enter('ASSOCIATION');
      const reply=await checked(d.associate(request,identity,session,local.signal));
      if(reply.schemaVersion!==2||reply.association?.state!=='ACTIVE'||reply.association.installationId!==identity.id||reply.association.timezone!==d.timezone())throw new Error('INVALID_ASSOCIATION_RESPONSE');
      await checked(d.rememberAssociation(identity,reply.association));
      if(uncertain){
        if(uncertain.sessionId!==session.id||uncertain.associationId!==reply.association.id)uncertain=null;
        else {enter('INGESTION');const recovered=await checked(d.send(uncertain.payload,identity,session,local.signal));uncertain=null;d.updated();return recovered;}
      }
      const windows=buildUsageWindows(reply.association,reply.serverTime,d.timezone());
      if(!windows.length)return {schemaVersion:2,reason:'NO_ELIGIBLE_INTERVAL'};
      if(!await checked(d.permission()))throw new Error('USAGE_ACCESS_REQUIRED');
      enter('CATALOG');
      const catalog=await checked(d.catalog(session,local.signal));
      if(catalog?.versao!==1||!Array.isArray(catalog.aplicativos)||!catalog.aplicativos.length)throw new Error('INVALID_CATALOG');
      enter('CONSENT');
      if(d.consent&&!await checked(d.consent(session,local.signal)))throw new Error('CONSENT_REQUIRED');
      enter('PERMISSION');
      if(!await checked(d.permission()))throw new Error('USAGE_ACCESS_REQUIRED');
      enter('COLLECTION');
      const values=await checked(d.collect(windows.map(({start,end})=>({start,end})),catalog.aplicativos.map(a=>a.packageId)));
      if(!Array.isArray(values)||values.length!==windows.length)throw new Error('INVALID_NATIVE_RESPONSE');
      if(!await checked(d.permission()))throw new Error('USAGE_ACCESS_REQUIRED');
      if(d.timezone()!==reply.association.timezone)throw new Error('TIMEZONE_VALIDATION_REQUIRED');
      // Revalidate remote revocation/episode before sending. The server checks again atomically.
      enter('REVALIDATION');
      const current=await checked(d.state(identity,session,local.signal));
      if(!current.consentActive||current.association?.id!==reply.association.id)throw new Error('ASSOCIATION_CHANGED');
      enter('SNAPSHOT');
      const snapshots=windows.map((w,i)=>{
        const result=values[i];const base={associationId:reply.association.id,localDate:w.localDate,timezone:reply.association.timezone,
          revision:(reply.revisions?.find(r=>r.localDate===w.localDate)?.revision??0)+1,observedAt:reply.serverTime,
          provenance:{source:'ANDROID_USAGE_EVENTS',collectorVersion:'events/2',catalogVersion:catalog.versao}};
        if(result.sourceStatus==='UNAVAILABLE')return {...base,sourceStatus:'UNAVAILABLE',attemptedInterval:{start:new Date(w.start).toISOString(),end:new Date(w.end).toISOString()},reason:result.reason,applications:null};
        if(result.sourceStatus!=='AVAILABLE'||!Array.isArray(result.applications)||!Array.isArray(result.qualityFlags))throw new Error('INVALID_NATIVE_RESPONSE');
        const expected=new Set(catalog.aplicativos.map(a=>a.packageId));
        if(result.applications.length!==expected.size||new Set(result.applications.map(a=>a.packageId)).size!==expected.size||result.applications.some(a=>!expected.has(a.packageId)||!Number.isSafeInteger(a.durationSeconds)||a.durationSeconds<0||a.durationSeconds>Math.floor((w.end-w.start)/1000)))throw new Error('INVALID_NATIVE_RESPONSE');
        return {...base,sourceStatus:'AVAILABLE',coverage:{interval:{start:new Date(w.start).toISOString(),end:new Date(w.end).toISOString()},completeness:'UNKNOWN',dayExtent:w.dayExtent},qualityFlags:result.qualityFlags,applications:result.applications};
      });
      const payload={schemaVersion:2,batchId:d.uuid(),snapshots};uncertain={payload,sessionId:session.id,associationId:reply.association.id};
      enter('INGESTION');
      try{const response=await checked(d.send(payload,identity,session,local.signal));uncertain=null;d.updated();return response;}
      catch(error){if(error?.response||local.signal.aborted)uncertain=null;throw error;}
    }catch(error){
      if(error&&typeof error==='object')error.usageMonitoringStage=stage;
      d.diagnostic?.(stage,'FAILED',error);throw error;
    }finally{session.signal.removeEventListener('abort',abort);}
  }
  return {run,stop};
}
