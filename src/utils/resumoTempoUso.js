import { obterJanelaDiaLocal } from './tempoUsoSync';
export function resumirTempoHoje(tempoUso = [], hoje = obterJanelaDiaLocal().dataLocal) {
  return tempoUso.filter(item => item?.tempo_uso_data_local?.slice(0, 10) === hoje).reduce((total, item) => {
    const seconds = Number(item?.tempo_uso_duracao_segundos);
    if (Number.isFinite(seconds) && seconds > 0) return total + seconds;
    const minutes = Number(item?.tempo_uso_minutos);
    return Number.isFinite(minutes) && minutes > 0 ? total + minutes * 60 : total;
  }, 0);
}
export function formatarTempoUso(segundos) {
  if (!Number.isFinite(segundos) || segundos <= 0) return '--';
  const total = Math.round(segundos), horas = Math.floor(total / 3600), minutos = Math.floor(total % 3600 / 60), restantes = total % 60;
  return [horas ? horas + 'h' : '', minutos ? minutos + 'm' : '', restantes ? restantes + 's' : ''].filter(Boolean).join(' ') || '0s';
}
