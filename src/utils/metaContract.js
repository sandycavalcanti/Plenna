function primeiroDefinido(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function temValor(value) {
  return value !== undefined && value !== null;
}

function dinheiroValido(value) {
  if (!temValor(value) || value === '') return false;
  const texto = String(value).trim().replace(',', '.');
  return /^\d{1,8}(?:\.\d{1,2})?$/.test(texto) && Number.isFinite(Number(texto));
}

export class ContratoMetasError extends Error {
  constructor(details) {
    super('INVALID_METAS');
    this.name = 'ContratoMetasError';
    this.code = 'INVALID_METAS';
    this.details = details;
  }
}

export function normalizarMetaRegistro(meta) {
  if (!meta || typeof meta !== 'object') return null;

  const rawId = primeiroDefinido(meta.meta_id, meta.id);
  const id = Number(rawId);
  const completada = primeiroDefinido(
    meta.meta_completado,
    typeof meta.concluida === 'boolean' ? meta.concluida : undefined,
  );

  return {
    ...meta,
    meta_id: Number.isInteger(id) && id > 0 ? id : null,
    meta_titulo: primeiroDefinido(meta.meta_titulo, meta.nome),
    meta_descricao: primeiroDefinido(meta.meta_descricao, meta.descricao),
    meta_valor: primeiroDefinido(meta.meta_valor, meta.valor),
    meta_valor_reservado: primeiroDefinido(meta.meta_valor_reservado, meta.valorReservado),
    progresso_percentual: primeiroDefinido(meta.progresso_percentual, meta.progressoPercentual),
    valor_restante: primeiroDefinido(meta.valor_restante, meta.valorRestante),
    meta_completado: completada,
  };
}

function invalidMeta(index, meta, field, reason) {
  const normalized = normalizarMetaRegistro(meta);
  throw new ContratoMetasError({
    index,
    metaId: normalized?.meta_id ?? null,
    field,
    reason,
  });
}

/** Valida o contrato aditivo de GET /metas sem transformar ausência em zero. */
export function normalizarRespostaMetas(payload) {
  if (!Array.isArray(payload)) {
    throw new ContratoMetasError({ index: null, metaId: null, field: 'resposta', reason: 'array_obrigatorio' });
  }

  const ids = new Set();
  return payload.map((rawMeta, index) => {
    const meta = normalizarMetaRegistro(rawMeta);
    if (!meta) invalidMeta(index, rawMeta, 'meta', 'objeto_obrigatorio');
    if (!meta.meta_id) invalidMeta(index, rawMeta, 'meta_id', 'identificador_invalido');
    if (ids.has(meta.meta_id)) invalidMeta(index, rawMeta, 'meta_id', 'identificador_duplicado');
    if (typeof meta.meta_titulo !== 'string' || !meta.meta_titulo.trim()) invalidMeta(index, rawMeta, 'meta_titulo', 'titulo_obrigatorio');
    if (typeof meta.meta_completado !== 'boolean') invalidMeta(index, rawMeta, 'meta_completado', 'boolean_obrigatorio');
    if (!dinheiroValido(meta.meta_valor)) invalidMeta(index, rawMeta, 'meta_valor', 'valor_monetario_invalido');
    if (!dinheiroValido(meta.meta_valor_reservado)) invalidMeta(index, rawMeta, 'meta_valor_reservado', 'valor_monetario_invalido');
    if (!temValor(meta.progresso_percentual) || !Number.isFinite(Number(meta.progresso_percentual))) invalidMeta(index, rawMeta, 'progresso_percentual', 'percentual_obrigatorio');
    if (!dinheiroValido(meta.valor_restante)) invalidMeta(index, rawMeta, 'valor_restante', 'valor_monetario_invalido');
    ids.add(meta.meta_id);
    return meta;
  });
}

function dataValida(value, allowNull = false) {
  if (allowNull && value === null) return true;
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function invalidHistorico(index, meta, field, reason) {
  const normalized = normalizarMetaRegistro(meta);
  throw new ContratoMetasError({
    index,
    metaId: normalized?.meta_id ?? null,
    field,
    reason,
  });
}

/** Valida o contrato mensal sem transformar histórico incompleto em saldo atual. */
export function normalizarRespostaHistoricoMetas(payload, periodoEsperado) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.metas)) {
    throw new ContratoMetasError({ index: null, metaId: null, field: 'resposta', reason: 'objeto_historico_obrigatorio' });
  }
  if (payload.versaoContrato !== 2 || payload.referenciaTemporal !== 'America/Sao_Paulo' ||
    typeof payload.periodo !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(payload.periodo) ||
    (periodoEsperado && payload.periodo !== periodoEsperado) ||
    !Array.isArray(payload.limitacoes) || payload.limitacoes.some((item) => typeof item !== 'string')) {
    throw new ContratoMetasError({ index: null, metaId: null, field: 'resposta', reason: 'contrato_historico_invalido' });
  }

  const ids = new Set();
  const metas = payload.metas.map((rawMeta, index) => {
    const normalized = normalizarMetaRegistro(rawMeta);
    if (!normalized) invalidHistorico(index, rawMeta, 'meta', 'objeto_obrigatorio');
    const meta = { ...normalized };
    if (!meta.meta_id) invalidHistorico(index, rawMeta, 'meta_id', 'identificador_invalido');
    if (ids.has(meta.meta_id)) invalidHistorico(index, rawMeta, 'meta_id', 'identificador_duplicado');
    if (typeof meta.meta_titulo !== 'string' || !meta.meta_titulo.trim()) invalidHistorico(index, rawMeta, 'meta_titulo', 'titulo_obrigatorio');
    if (!dinheiroValido(meta.meta_valor)) invalidHistorico(index, rawMeta, 'meta_valor', 'valor_monetario_invalido');
    if (!dinheiroValido(meta.meta_valor_reservado)) invalidHistorico(index, rawMeta, 'meta_valor_reservado', 'valor_monetario_invalido');
    if (!temValor(meta.progresso_percentual) || !Number.isFinite(Number(meta.progresso_percentual)) || Number(meta.progresso_percentual) < 0) {
      invalidHistorico(index, rawMeta, 'progresso_percentual', 'percentual_invalido');
    }
    if (typeof meta.meta_completado !== 'boolean') invalidHistorico(index, rawMeta, 'meta_completado', 'boolean_obrigatorio');
    if (!dataValida(rawMeta.meta_data_criacao)) invalidHistorico(index, rawMeta, 'meta_data_criacao', 'data_invalida');
    if (!dataValida(rawMeta.meta_data_conclusao, true)) invalidHistorico(index, rawMeta, 'meta_data_conclusao', 'data_invalida');
    for (const field of ['saldo_historico_disponivel', 'historico_completo']) {
      if (typeof rawMeta[field] !== 'boolean') invalidHistorico(index, rawMeta, field, 'boolean_obrigatorio');
    }
    if (!Array.isArray(rawMeta.historico_limitacoes) || rawMeta.historico_limitacoes.some((item) => typeof item !== 'string')) {
      invalidHistorico(index, rawMeta, 'historico_limitacoes', 'lista_invalida');
    }
    ids.add(meta.meta_id);
    return { ...meta, meta_data_conclusao: rawMeta.meta_data_conclusao ?? null };
  });

  return { ...payload, metas };
}
