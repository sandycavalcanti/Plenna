export const filtrosIniciais = {modo:'TODOS',mes:'',inicio:'',fim:'',status:'TODOS',busca:''};
export function diaAtualCompras(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return ['year','month','day'].map(type=>parts.find(part=>part.type===type).value).join('-');
}
export const filtrosTemporaisIniciais = (now = new Date()) => ({...filtrosIniciais,modo:'MES',mes:diaAtualCompras(now).slice(0,7)});

export function parametrosTemporaisCompras(filtros, now = new Date(), inicioConta = null) {
  const params = parametrosHistorico({...filtros,status:'TODOS',busca:''});
  const today = diaAtualCompras(now);
  if (params.mes > today.slice(0,7) || params.fim > today) throw Error('Escolha um período até a data atual.');
  if (inicioConta && (params.mes < inicioConta.slice(0,7) || params.inicio < inicioConta))
    throw Error('Escolha um período a partir da criação da sua conta.');
  // Sem intervalo explícito: preserva a inclusão autorizada de importações retroativas.
  return filtros.modo === 'TODOS' ? {} : params;
}

export function referenciaInicioHistorico(criacao) {
  const date = new Date(criacao);
  const initial = criacao && Number.isFinite(date.getTime()) ? diaAtualCompras(date) : null;
  return initial;
}
export function dataCivilInput(value) {
  if (!/^\d{2}\/\d{2}\/[1-9]\d{3}$/.test(value)) return null;
  const [day,month,year]=value.split('/');const iso=`${year}-${month}-${day}`;
  const date=new Date(iso+'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===iso ? iso : null;
}
export function parametrosHistorico(filtros) {
  if(!['TODOS','MES','INTERVALO'].includes(filtros.modo))throw Error('Período não disponível.');
  if(!['TODOS','CONFIRMADA','AGUARDANDO_CONFIRMACAO','IGNORADA'].includes(filtros.status))throw Error('Status não disponível.');
  const params={};
  if(filtros.modo==='MES') {
    if(!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(filtros.mes)) throw Error('Informe um mês válido.');
    params.mes=filtros.mes;
  } else if(filtros.modo==='INTERVALO') {
    const inicio=dataCivilInput(filtros.inicio),fim=dataCivilInput(filtros.fim);
    if(!inicio||!fim||inicio>fim)throw Error('Confira as datas de início e fim.');
    Object.assign(params,{inicio,fim});
  }
  if(filtros.status!=='TODOS')params.status=filtros.status;
  if(filtros.busca?.trim())params.busca=filtros.busca.trim().slice(0,100);
  return params;
}
