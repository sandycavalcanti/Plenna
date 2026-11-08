export function dataLocalRegistroUso(registro) {
  const local = String(registro?.tempo_uso_data_local || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(local)) return local;
  const date = new Date(registro?.tempo_uso_data || registro?.tempo_uso_inicio || NaN);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: registro?.tempo_uso_timezone || 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function filtrarHistoricoUso(registros = [], mes) {
  return registros.filter(registro => dataLocalRegistroUso(registro)?.slice(0, 7) === mes);
}

export function segundosHistoricoUso(registros = []) {
  return registros.reduce((total, registro) => {
    const segundos = Number(registro?.tempo_uso_duracao_segundos);
    const valor = Number.isFinite(segundos) && segundos > 0 ? segundos : Number(registro?.tempo_uso_minutos) * 60;
    return total + (Number.isFinite(valor) && valor > 0 ? valor : 0);
  }, 0);
}
