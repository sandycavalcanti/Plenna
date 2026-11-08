export function mensagemErroAnalytics(error) {
  const status=error?.response?.status;
  if(status===400)return 'O período não foi aceito pela API. Recarregue os dados; se persistir, verifique a compatibilidade da versão do aplicativo.';
  if(status===401||error?.message==='SESSION_REQUIRED'||error?.message==='SESSION_CHANGED')return 'Sua sessão mudou. Entre novamente para consultar.';
  if(status>=500||error?.code==='INVALID_DASHBOARD_CONTRACT')return 'Os indicadores deste período estão indisponíveis. Tente novamente mais tarde.';
  return 'Não foi possível consultar o período. Confira sua conexão e tente novamente.';
}
export function diagnosticoAnalytics(error,params) {
  const permitidos=new Set(['mode','month','months','end','monthA','monthB','periodos','comparacao','timezone']);
  const fields=error?.response?.data?.errors;
  let api=null;
  try {const url=new URL(error?.config?.baseURL);if(['http:','https:'].includes(url.protocol))api=url.origin;}catch{}
  return {rota:'/dashboard/analytics',api,modo:params.mode,mes:params.month,
    campos:Array.isArray(fields)?[...new Set(fields.map(v=>v?.field).filter(v=>typeof v==='string'&&v.length<=200&&/^[a-zA-Z_]+(\.[a-zA-Z_]+)*$/.test(v)&&permitidos.has(v.split('.')[0])))]:[],
    fase:error?.response?.data?.code==='ANALYTICS_OUTPUT_INVALID'?'RESPOSTA':error?.response?.status===400?'VALIDACAO':'CONSULTA'};
}
