const campos = [
  'planejamento',
  'influenciaPromocional',
  'necessidadeInesperada',
  'momento',
  'autopercepcaoImpulsividade',
];
const declaracao = ['SIM', 'NAO', 'NAO_LEMBRO', 'PREFIRO_NAO_RESPONDER'];
const valores = (campo) =>
  campo === 'planejamento'
    ? [...declaracao, 'PARCIALMENTE']
    : campo === 'momento'
      ? [
          'ANTECIPADA',
          'ADIADA',
          'NO_MOMENTO_PREVISTO',
          'NAO_LEMBRO',
          'PREFIRO_NAO_RESPONDER',
        ]
      : declaracao;
const objeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const id = (v) => Number.isSafeInteger(v) && v > 0;
const unico = (list) => new Set(list).size === list.length;
export const tiposEventoPosterior = [
  'CANCELAMENTO',
  'DEVOLUCAO',
  'REEMBOLSO',
  'ARREPENDIMENTO',
];
export function validarContexto(data, compraId) {
  if (
    !objeto(data) ||
    data.versaoContrato !== 1 ||
    data.compraId !== compraId ||
    !Number.isInteger(data.revisao) ||
    data.revisao < 0 ||
    !(
      data.criadaEm === null ||
      (typeof data.criadaEm === 'string' &&
        Number.isFinite(Date.parse(data.criadaEm)))
    ) ||
    !objeto(data.respostas) ||
    Object.entries(data.respostas).some(
      ([k, v]) => !campos.includes(k) || !valores(k).includes(v),
    ) ||
    (data.eventosPosteriores !== undefined &&
      (!Array.isArray(data.eventosPosteriores) ||
        data.eventosPosteriores.length > 4 ||
        !unico(data.eventosPosteriores) ||
        data.eventosPosteriores.some(
          (e) => !tiposEventoPosterior.includes(e),
        ))) ||
    !Array.isArray(data.itens) ||
    data.itens.some(
      (i) =>
        !objeto(i) ||
        !id(i.itemId) ||
        !valores('planejamento').includes(i.planejamento),
    ) ||
    !unico(data.itens.map((i) => i.itemId))
  )
    throw Error('INVALID_CONTEXT');
  return data;
}
export function validarPerguntas(data, contexto) {
  if (
    !objeto(data) ||
    data.versaoContrato !== 1 ||
    data.versaoCatalogo !== 'contexto-1' ||
    data.compraId !== contexto.compraId ||
    data.revisao !== contexto.revisao ||
    !Array.isArray(data.catalogo) ||
    data.catalogo.length !== campos.length ||
    !unico(data.catalogo.map((q) => q?.campo)) ||
    data.catalogo.some(
      (q) =>
        !objeto(q) ||
        !campos.includes(q.campo) ||
        q.codigo !== q.campo ||
        q.versao !== 1 ||
        typeof q.texto !== 'string' ||
        !Array.isArray(q.opcoes) ||
        q.opcoes.length !== valores(q.campo).length ||
        !unico(q.opcoes.map((o) => o?.valor)) ||
        q.opcoes.some(
          (o) =>
            !objeto(o) ||
            !valores(q.campo).includes(o.valor) ||
            typeof o.texto !== 'string',
        ),
    ) ||
    !Array.isArray(data.itens) ||
    data.itens.some(
      (i) => !objeto(i) || !id(i.itemId) || typeof i.nome !== 'string',
    ) ||
    !unico(data.itens.map((i) => i.itemId)) ||
    contexto.itens.some(
      (i) => !data.itens.some((item) => item.itemId === i.itemId),
    ) ||
    !Array.isArray(data.perguntas) ||
    data.perguntas.some(
      (q) =>
        !objeto(q) ||
        typeof q.motivo !== 'string' ||
        (q.codigo === 'planejamentoItem'
          ? !data.itens.some((i) => i.itemId === q.itemId)
          : !campos.includes(q.codigo) || q.itemId !== undefined),
    ) ||
    !unico(data.perguntas.map((q) => q.codigo + ':' + (q.itemId ?? ''))) ||
    !Array.isArray(data.planejamentoItemOpcoes) ||
    data.planejamentoItemOpcoes.length !== 5 ||
    !unico(data.planejamentoItemOpcoes.map((o) => o?.valor)) ||
    data.planejamentoItemOpcoes.some(
      (o) =>
        !objeto(o) ||
        !valores('planejamento').includes(o.valor) ||
        typeof o.texto !== 'string',
    )
  )
    throw Error('INVALID_QUESTIONS');
  return data;
}

// A valid schema alone is not an acknowledgement: require the committed revision and changes.
export function validarConfirmacaoContexto(data, compraId, body) {
  const c = validarContexto(data, compraId);
  if (
    c.revisao !== body.revisaoEsperada + 1 ||
    c.criadaEm === null ||
    Object.entries(body.respostas ?? {}).some(([campo, valor]) =>
      valor === null
        ? c.respostas[campo] !== undefined
        : c.respostas[campo] !== valor,
    ) ||
    (body.itens ?? []).some((item) => {
      const saved = c.itens.find((i) => i.itemId === item.itemId);
      return item.planejamento === null
        ? !!saved
        : saved?.planejamento !== item.planejamento;
    }) ||
    (body.eventosPosteriores !== undefined &&
      (c.eventosPosteriores?.length !== body.eventosPosteriores.length ||
        body.eventosPosteriores.some((e) => !c.eventosPosteriores.includes(e))))
  )
    throw Error('INVALID_CONTEXT_ACK');
  return c;
}
function falhaSalvamento(error) {
  const status = Number.isInteger(error?.response?.status)
    ? error.response.status
    : null;
  const tipo =
    status === 409
      ? 'CONFLITO'
      : status === 401
        ? 'AUTENTICACAO'
        : status === 403
          ? 'PERMISSAO'
          : status === 404
            ? 'INDISPONIVEL'
            : status === 400 || status === 422
              ? 'VALIDACAO'
              : status !== null
                ? 'SERVIDOR'
                : ['INVALID_CONTEXT', 'INVALID_CONTEXT_ACK'].includes(
                      error?.message,
                    )
                  ? 'CONTRATO'
                  : 'REDE';
  const mensagens = {
    CONFLITO: 'O contexto mudou. Recarregue antes de salvar.',
    AUTENTICACAO: 'Sua sessão expirou. Entre novamente para salvar.',
    PERMISSAO: 'Você não tem permissão para salvar esta compra.',
    INDISPONIVEL: 'Compra ou item indisponível. Recarregue o contexto.',
    VALIDACAO: 'Revise as respostas e tente novamente.',
    SERVIDOR: 'Não foi possível salvar agora. Suas respostas foram mantidas.',
    CONTRATO:
      'A API não confirmou o salvamento. Suas respostas foram mantidas.',
    REDE: 'Sem confirmação da API. Tente novamente; suas respostas foram mantidas.',
  };
  return { tipo, statusHttp: status, mensagem: mensagens[tipo] };
}

// Dependency-injected state machine: no native imports; session is bound once per editor.
export function criarEditorContexto({
  compraId,
  client,
  storage,
  uuid,
  onChange,
}) {
  let state = { status: 'loading', dados: null, error: null },
    session,
    detached = () => {},
    disposed = false,
    generation = 0,
    busy = false,
    pending;
  const controller = new AbortController();
  const emit = (next) => {
    state = { ...state, ...next };
    if (!disposed) onChange(state);
  };
  const check = () => {
    if (disposed || controller.signal.aborted) throw Error('EDITOR_CLOSED');
    storage.assertSession(session.id);
  };
  async function bind() {
    if (!session) {
      session = await storage.captureSession();
      if (disposed || !session) throw Error('SESSION_REQUIRED');
      const invalidate = () => {
        generation++;
        controller.abort();
        pending = undefined;
        emit({
          status: 'session',
          dados: null,
          error: 'Sua sessão mudou. Feche esta janela para continuar.',
        });
      };
      session.signal.addEventListener('abort', invalidate, { once: true });
      detached = () => session.signal.removeEventListener('abort', invalidate);
      if (session.signal.aborted) invalidate();
    }
    check();
    return { signal: controller.signal, rf017SessionId: session.id };
  }
  async function load(salvo = false) {
    if (busy) return;
    const previous = state.dados;
    const run = ++generation;
    emit({ status: 'loading', dados: previous, error: null, salvo: false });
    try {
      const config = await bind();
      const [c, p] = await Promise.all([
        client.get(`/v2/compras/${compraId}/contexto`, config),
        client.get(`/v2/compras/${compraId}/perguntas`, config),
      ]);
      check();
      const contexto = validarContexto(c.data, compraId);
      const perguntas = validarPerguntas(p.data, contexto);
      if (run === generation) {
        emit({
          status: 'ready',
          dados: { contexto, perguntas },
          error: null,
          perguntasError: null,
          salvo,
        });
      }
    } catch {
      if (run === generation && !disposed)
        emit({
          status: controller.signal.aborted ? 'session' : 'error',
          dados: controller.signal.aborted ? null : previous,
          error: 'Não foi possível carregar o contexto. Tente novamente.',
        });
    }
  }
  async function save(respostas, itens, eventosPosteriores) {
    if (busy || !state.dados || !['ready', 'saveError'].includes(state.status))
      return;
    busy = true;
    const run = ++generation;
    const body = {
      versaoContrato: 1,
      revisaoEsperada: state.dados.contexto.revisao,
      respostas,
      itens,
      ...(eventosPosteriores === undefined ? {} : { eventosPosteriores }),
    };
    try {
      const key = JSON.stringify(body);
      if (pending?.key !== key)
        pending = { key, body: { ...body, operacaoId: uuid() } };
      emit({ status: 'saving', error: null, salvo: false, diagnostico: null });
      const config = await bind();
      const response = await client.patch(
        `/v2/compras/${compraId}/contexto`,
        pending.body,
        { ...config, timeout: 15000 },
      );
      check();
      const contexto = validarConfirmacaoContexto(
        response.data,
        compraId,
        pending.body,
      );
      if (run !== generation) return;
      pending = undefined;
      busy = false;
      emit({
        status: 'ready',
        dados: { contexto, perguntas: null },
        error: null,
        perguntasError: null,
        salvo: true,
      });
      if (disposed || run !== generation || controller.signal.aborted) return;
      // Questions are an optional follow-up. Reflection is never called by the save operation.
      try {
        const p = await client.get(`/v2/compras/${compraId}/perguntas`, {
          ...config,
          timeout: 8000,
        });
        check();
        const perguntas = validarPerguntas(p.data, contexto);
        if (run === generation)
          emit({
            status: 'ready',
            dados: { contexto, perguntas },
            salvo: false,
          });
      } catch {
        if (run === generation && !disposed && !controller.signal.aborted)
          emit({
            status: 'ready',
            salvo: false,
            perguntasError:
              'Respostas salvas. Não foi possível atualizar as perguntas.',
          });
      }
    } catch (error) {
      if (run === generation && !disposed) {
        const failure = falhaSalvamento(error);
        const diagnostico = {
          metodo: 'PATCH',
          endpoint: '/v2/compras/:compraId/contexto',
          statusHttp: failure.statusHttp,
          tipo: failure.tipo,
        };
        if (typeof __DEV__ !== 'undefined' && __DEV__)
          console.warn('ANALISE_CONTEXT_SAVE_FAILED', diagnostico);
        emit({
          status: controller.signal.aborted
            ? 'session'
            : failure.tipo === 'CONFLITO'
              ? 'conflict'
              : 'saveError',
          error: failure.mensagem,
          salvo: false,
          diagnostico,
        });
      }
    } finally {
      if (run === generation) busy = false;
    }
  }
  return {
    load,
    save,
    dispose() {
      disposed = true;
      generation++;
      controller.abort();
      detached();
      pending = undefined;
    },
    getState: () => state,
  };
}
