const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const strings = (v) =>
  Array.isArray(v) && v.every((s) => typeof s === 'string');
const facts = (v) =>
  Array.isArray(v) &&
  v.every(
    (f) =>
      object(f) &&
      typeof f.codigo === 'string' &&
      typeof f.mensagem === 'string' &&
      strings(f.referencias),
  );
export function validarExplicacaoAvaliacao(e) {
  if (e === undefined || e === null) return e;
  if (!object(e) || e.versao !== 1 || e.origem !== 'RESULTADO_PERSISTIDO' ||
      typeof e.resumo !== 'string' || e.naturezaResumo !== 'INTERPRETADO' || !strings(e.referenciasResumo) ||
      !(e.reflexao === null || typeof e.reflexao === 'string') || !facts(e.fatores) ||
      e.fatores.some(f => !['REGISTRADO','DECLARADO','INTERPRETADO'].includes(f.natureza) || !f.referencias.length ||
        (f.campo !== undefined && typeof f.campo !== 'string') ||
        (f.valor !== undefined && typeof f.valor !== 'string') ||
        (f.itemId !== undefined && (!Number.isSafeInteger(f.itemId) || f.itemId < 1))) ||
      !Number.isSafeInteger(e.totalFatores) || e.totalFatores < e.fatores.length ||
      typeof e.fatoresCompletos !== 'boolean' || e.fatoresCompletos !== (e.totalFatores === e.fatores.length) ||
      !Array.isArray(e.regrasAplicadas) || e.regrasAplicadas.some(r => !object(r) || typeof r.codigo !== 'string' || r.versao !== 1 || !strings(r.referencias)) ||
      !strings(e.limitacoes) || e.historicoCompras !== 'NAO_REGISTRADO_NESTE_RESULTADO') throw Error('INVALID_ASSESSMENT_EXPLANATION');
  return e;
}

// Rollout compatível: somente GET; servidor anterior pode rejeitar o parâmetro novo.
export async function consultarAvaliacaoComExplicacao(client, url, options) {
  try {
    return await client.get(url, { ...options, params: { ...options?.params, explicacao: '1' } });
  } catch (error) {
    if (error?.response?.status !== 400 || options?.signal?.aborted) throw error;
    return client.get(url, options);
  }
}
export function validarAvaliacao(data, compraId) {
  if (
    !object(data) ||
    data.versaoContrato !== 1 ||
    data.compraId !== compraId ||
    !['SEM_AVALIACAO', 'VIGENTE', 'DESATUALIZADA'].includes(data.atualidade) ||
    !strings(data.motivos) ||
    !(
      data.avaliacaoId === null ||
      (Number.isInteger(data.avaliacaoId) && data.avaliacaoId > 0)
    ) ||
    !(
      data.criadaEm === null ||
      (typeof data.criadaEm === 'string' &&
        Number.isFinite(Date.parse(data.criadaEm)))
    )
  )
    throw Error('INVALID_ASSESSMENT');
  const r = data.resultado;
  if (
    data.atualidade === 'SEM_AVALIACAO' &&
    (r !== null || data.avaliacaoId !== null)
  )
    throw Error('INVALID_ASSESSMENT');
  if (data.atualidade === 'VIGENTE' && r === null)
    throw Error('INVALID_ASSESSMENT');
  if (
    r !== null &&
    (!object(r) ||
      r.versaoContrato !== 1 ||
      !['contextual-1', 'contextual-2'].includes(r.versaoMotor) ||
      r.compraId !== compraId ||
      !Number.isInteger(r.contextoRevisao) ||
      r.contextoRevisao < 0 ||
      !['NAO_AVALIAVEL', 'DADOS_INSUFICIENTES', 'CONTEXTO_DISPONIVEL'].includes(
        r.estado,
      ) ||
      !facts(r.observacoes) ||
      !facts(r.declaracoes) ||
      r.declaracoes.some(
        (d) => typeof d.campo !== 'string' || typeof d.valor !== 'string',
      ) ||
      !(
        r.autopercepcao === null ||
        (facts([r.autopercepcao]) && typeof r.autopercepcao.valor === 'string')
      ) ||
      !object(r.interpretacao) ||
      typeof r.interpretacao.mensagem !== 'string' ||
      !(
        r.interpretacao.reflexao === null ||
        typeof r.interpretacao.reflexao === 'string'
      ) ||
      !strings(r.interpretacao.referencias) ||
      !strings(r.limitacoes) ||
      !Array.isArray(r.evidencias) ||
      r.evidencias.some(
        (e) =>
          !object(e) ||
          typeof e.referencia !== 'string' ||
          !['REGISTRADO', 'DECLARADO'].includes(e.natureza),
      ) ||
      !Array.isArray(r.regrasAplicadas) ||
      r.regrasAplicadas.some(
        (q) =>
          !object(q) ||
          typeof q.codigo !== 'string' ||
          q.versao !== 1 ||
          typeof q.justificativa !== 'string' ||
          !strings(q.referencias),
      ))
  )
    throw Error('INVALID_ASSESSMENT');
  const explicacao = validarExplicacaoAvaliacao(data.explicacao);
  if (explicacao && (!r || explicacao.resumo !== r.interpretacao.mensagem ||
      explicacao.reflexao !== r.interpretacao.reflexao || !explicacao.fatoresCompletos))
    throw Error('INVALID_ASSESSMENT_EXPLANATION');
  return data;
}

export function criarConsultaAvaliacao({
  compraId,
  avaliacaoId,
  client,
  storage,
  onChange,
}) {
  let disposed = false,
    session,
    detach = () => {},
    generation = 0,
    busy = false;
  const controller = new AbortController();
  const emit = (s) => {
    if (!disposed) onChange(s);
  };
  const check = () => {
    if (disposed || controller.signal.aborted) throw Error('INVALID_SESSION');
    storage.assertSession(session.id);
  };
  async function run(calcular = false, revisaoEsperada) {
    if (calcular && avaliacaoId !== undefined) throw Error('HISTORICAL_ASSESSMENT_READ_ONLY');
    if (busy) return;
    busy = true;
    const id = ++generation;
    emit({ status: 'loading', dados: null });
    try {
      if (!session) {
        session = await storage.captureSession();
        if (!session || disposed) throw Error('SESSION_REQUIRED');
        const abort = () => {
          generation++;
          controller.abort();
          emit({ status: 'session', dados: null });
        };
        session.signal.addEventListener('abort', abort, { once: true });
        detach = () => session.signal.removeEventListener('abort', abort);
        if (session.signal.aborted) abort();
      }
      check();
      const options = { signal: controller.signal, usageMonitoringSessionId: session.id };
      const url = `/v2/compras/${compraId}/avaliacoes`;
      const response = calcular
        ? await client.post(url, { revisaoEsperada }, options)
        : await consultarAvaliacaoComExplicacao(client, url + '/' + (avaliacaoId ?? 'atual'), options);
      check();
      const dados = validarAvaliacao(response.data, compraId);
      if (avaliacaoId !== undefined && dados.avaliacaoId !== avaliacaoId) throw Error('ASSESSMENT_MISMATCH');
      if (calcular && dados.resultado?.contextoRevisao !== revisaoEsperada)
        throw Error('CONTEXT_CHANGED');
      if (id === generation) emit({ status: 'ready', dados, consultadoEm:new Date().toISOString() });
    } catch (error) {
      if (id === generation && !disposed)
        emit({
          status: error?.response?.status === 409 ? 'conflict' : 'error',
          dados: null,
        });
    } finally {
      busy = false;
    }
  }
  return {
    consultar: () => run(),
    calcular: (revision) => run(true, revision),
    dispose() {
      disposed = true;
      generation++;
      controller.abort();
      detach();
    },
  };
}
