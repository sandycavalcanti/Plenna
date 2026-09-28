import { filtrarUsoAplicativosCompra } from './tempoUso';

export function obterTimezoneLocal() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function formatarDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function formatarOffset(data) {
  const minutos = -data.getTimezoneOffset();
  const sinal = minutos >= 0 ? '+' : '-';

  const absoluto = Math.abs(minutos);
  const horas = String(Math.floor(absoluto / 60)).padStart(2, '0');
  const mins = String(absoluto % 60).padStart(2, '0');

  return `${sinal}${horas}:${mins}`;
}

function formatarInstanteLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  const segundo = String(data.getSeconds()).padStart(2, '0');

  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}${formatarOffset(data)}`;
}

export function obterJanelaDiaLocal(dataReferencia = new Date()) {
  const inicio = new Date(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth(),
    dataReferencia.getDate(),
    0,
    0,
    0,
    0
  );

  const fim = new Date(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth(),
    dataReferencia.getDate() + 1,
    0,
    0,
    0,
    0
  );

  return {
    inicio,
    fim,
    dataLocal: formatarDataLocal(inicio),
    timezone: obterTimezoneLocal(),
  };
}

export function montarPayloadTempoUsoDiario(registros, dataReferencia = new Date(), aplicativos = []) {
  const filtrados = filtrarUsoAplicativosCompra(registros, aplicativos);

  const {
    inicio,
    fim,
    dataLocal,
    timezone,
  } = obterJanelaDiaLocal(dataReferencia);

  const registrosValidos = filtrados
    .filter((registro) =>
      Number.isInteger(registro.durationSeconds) &&
      registro.durationSeconds > 0
    )
    .map((registro) => ({
      packageId: registro.packageId,
      dataLocal,
      timezone,
      inicio: formatarInstanteLocal(inicio),
      fim: formatarInstanteLocal(fim),
      duracaoSegundos: registro.durationSeconds,
    }));

  return {
    schemaVersion: 1,
    registros: registrosValidos,
  };
}

export function obterJanelasRecuperacaoTempoUso(agora = new Date()) {
  return [0, 1, 2].map((diasAtras) => {
    const referencia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - diasAtras);
    const janela = obterJanelaDiaLocal(referencia);
    return { ...janela, fimColeta: diasAtras === 0 ? agora : janela.fim };
  });
}

export function mesmoDiaLocal(primeira, segunda) {
  return formatarDataLocal(primeira) === formatarDataLocal(segunda);
}
