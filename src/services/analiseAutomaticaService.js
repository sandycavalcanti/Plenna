const estados = [
  'DADOS_INSUFICIENTES',
  'SEM_SINAIS_RELEVANTES',
  'SINAIS_RELEVANTES',
  'COMBINACAO_SINAIS_RELEVANTES',
];
export function validarAnaliseAutomatica(d, compraId) {
  if (
    d?.versaoContrato !== 1 ||
    d.versaoMotor !== 'automatico-1' ||
    d.compraId !== compraId ||
    d.escopo !== 'COMPRA' ||
    !estados.includes(d.estado) ||
    d.classificacaoAutomaticaDefinitiva !== false ||
    d.persistido !== false ||
    !Array.isArray(d.evidencias) ||
    !Array.isArray(d.descobertas) ||
    !Array.isArray(d.limitacoes) ||
    !Number.isSafeInteger(d.qualidadeDados?.registrosElegiveis) ||
    d.qualidadeDados.registrosElegiveis < 0 ||
    !Number.isFinite(Date.parse(d.janela?.inicio)) ||
    !Number.isFinite(Date.parse(d.janela?.fimExclusivo)) ||
    d.evidencias.some(
      (e) =>
        !e.indicador ||
        !e.regra ||
        !['VALORES', 'FREQUENCIA'].includes(e.familia) ||
        typeof e.sinal !== 'boolean' ||
        !['CENTAVOS', 'COMPRAS'].includes(e.unidade) ||
        !Number.isFinite(e.observado) ||
        !Number.isFinite(e.referencia) ||
        !Number.isSafeInteger(e.amostra) ||
        e.amostra < 0,
    ) ||
    d.descobertas.some(
      (e) =>
        e.tipo !== 'OBSERVACAO_AUTOMATICA' ||
        typeof e.titulo !== 'string' ||
        typeof e.mensagem !== 'string',
    ) ||
    !/^[a-f0-9]{64}$/.test(d.dependencias?.fontesHash ?? '')
  )
    throw Error('INVALID_AUTOMATIC_ASSESSMENT');
  const sinais = d.evidencias.filter((e) => e.sinal),
    familias = new Set(sinais.map((e) => e.familia));
  if (
    (d.estado === 'SEM_SINAIS_RELEVANTES' &&
      (!d.evidencias.length || sinais.length)) ||
    (d.estado === 'SINAIS_RELEVANTES' && familias.size !== 1) ||
    (d.estado === 'COMBINACAO_SINAIS_RELEVANTES' && familias.size < 2) ||
    (['SINAIS_RELEVANTES', 'COMBINACAO_SINAIS_RELEVANTES'].includes(d.estado) &&
      d.descobertas.length !== 1)
  )
    throw Error('INVALID_AUTOMATIC_ASSESSMENT');
  return d;
}
export async function consultarAnaliseAutomatica({
  client,
  storage,
  session,
  compraId,
}) {
  storage.assertSession(session.id);
  const { data } = await client.get(
    `/analises/compras/${compraId}/automatica`,
    { signal: session.signal, rf017SessionId: session.id, timeout: 15000 },
  );
  storage.assertSession(session.id);
  return validarAnaliseAutomatica(data, compraId);
}
