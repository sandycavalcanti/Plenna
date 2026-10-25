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
  return data;
}

export function criarConsultaAvaliacao({
  compraId,
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
      const options = { signal: controller.signal, rf017SessionId: session.id };
      const url = `/v2/compras/${compraId}/avaliacoes`;
      const response = calcular
        ? await client.post(url, { revisaoEsperada }, options)
        : await client.get(url + '/atual', options);
      check();
      const dados = validarAvaliacao(response.data, compraId);
      if (calcular && dados.resultado?.contextoRevisao !== revisaoEsperada)
        throw Error('CONTEXT_CHANGED');
      if (id === generation) emit({ status: 'ready', dados });
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
