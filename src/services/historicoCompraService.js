const count = (n) => Number.isInteger(n) && n >= 0;
const date = (s) => typeof s === 'string' && Number.isFinite(Date.parse(s));
const strings = (v) =>
  Array.isArray(v) && v.every((s) => typeof s === 'string');
const declaration = (d) =>
  d &&
  ['universo', 'conhecidas', 'ausentes', 'recusadas', 'naoLembra'].every((k) =>
    count(d[k]),
  ) &&
  d.conhecidas + d.ausentes + d.recusadas + d.naoLembra === d.universo &&
  ((d.cobertura === null && d.universo === 0) ||
    d.cobertura === d.conhecidas / d.universo) &&
  ['SIM', 'PARCIALMENTE', 'NAO'].every((k) => count(d.contagens?.[k])) &&
  Object.values(d.contagens).reduce((a, b) => a + b, 0) === d.conhecidas;

export function validarHistoricoCompra(d, compraId) {
  const h = d?.historico,
    r = d?.reflexoesHistoricas,
    dep = d?.dependenciasHistoricas;
  if (d?.monitoramento) {
    const m = d.monitoramento;
    if (
      !['PARCIAL', 'SEM_DADOS', 'SEM_AUTORIZACAO', 'INDISPONIVEL'].includes(
        m.disponibilidade,
      ) ||
      !strings(m.dias) ||
      !strings(m.referencias) ||
      m.associacaoComCompra !== 'INDISPONIVEL' ||
      !(
        m.minutosRegistrados === null ||
        (Number.isFinite(m.minutosRegistrados) && m.minutosRegistrados > 0)
      ) ||
      (m.minutosRegistrados !== null &&
        (!Array.isArray(m.porDia) ||
          !Array.isArray(m.porAplicativo) ||
          m.porDia.some(
            (p) =>
              !date(p.data) || !Number.isFinite(p.minutos) || p.minutos <= 0,
          ) ||
          m.porAplicativo.some(
            (p) =>
              typeof p.nome !== 'string' ||
              typeof p.packageId !== 'string' ||
              !Number.isFinite(p.minutos) ||
              p.minutos <= 0,
          )))
    )
      throw Error('INVALID_HISTORY');
  }
  if (d?.descobertas) {
    const a = d.descobertas;
    if (
      dep?.versaoDescobertas !== undefined &&
      dep.versaoDescobertas !== a.versao
    )
      throw Error('INVALID_HISTORY');
    if (
      a.versao !== 'automaticas-1' ||
      !Array.isArray(a.itens) ||
      a.itens.length > 3 ||
      new Set(a.itens.map((i) => i.codigo)).size !== a.itens.length ||
      a.itens.some(
        (i) =>
          typeof i.codigo !== 'string' ||
          !['REGISTRADO', 'DECLARADO', 'REFERENCIA_ATUAL'].includes(
            i.natureza,
          ) ||
          typeof i.titulo !== 'string' ||
          typeof i.detalhe !== 'string' ||
          !strings(i.referencias) ||
          !i.referencias.length ||
          (i.grafico !== undefined &&
            (!['CENTAVOS', 'COMPRAS', 'MINUTOS'].includes(i.grafico.unidade) ||
              !Array.isArray(i.grafico.pontos) ||
              i.grafico.pontos.length < 2 ||
              i.grafico.pontos.some(
                (p) =>
                  typeof p.rotulo !== 'string' ||
                  !Number.isFinite(p.valor) ||
                  p.valor < 0,
              ))),
      ) ||
      !(a.reflexao === null || typeof a.reflexao === 'string') ||
      !strings(a.eventosPosteriores) ||
      !strings(a.limitacoes) ||
      !Array.isArray(a.perguntasSugeridas) ||
      a.perguntasSugeridas.some(
        (p) =>
          ![
            'planejamento',
            'influenciaPromocional',
            'necessidadeInesperada',
          ].includes(p),
      )
    )
      throw Error('INVALID_HISTORY');
  }
  if (h?.politicaTemporal) {
    const p = h.politicaTemporal;
    const base = (b) =>
      b &&
      count(b.registros) &&
      b.continuidadeComprovada === false &&
      (b.disponivel === null
        ? b.registros === 0
        : b.registros > 0 &&
          date(b.disponivel.inicio) &&
          date(b.disponivel.fimInclusivo) &&
          Date.parse(b.disponivel.inicio) <=
            Date.parse(b.disponivel.fimInclusivo) &&
          Date.parse(b.disponivel.inicio) >= Date.parse(p.solicitado?.inicio) &&
          Date.parse(b.disponivel.fimInclusivo) <
            Date.parse(p.solicitado?.fimExclusivo));
    if (
      p.versao !== 'temporal-1' ||
      dep?.versaoPoliticaTemporal !== p.versao ||
      p.solicitado?.inicio !== h.janelaHistorico?.inicio ||
      p.solicitado?.fimExclusivo !== h.observadoAte ||
      ![
        p.compras,
        p.valores,
        p.categorias,
        p.planejamento,
        p.influenciaPromocional,
      ].every(base) ||
      p.compras.registros !==
        h.qualidade?.comprasAtual + h.qualidade?.comprasHistorico ||
      typeof p.comparacaoElegivel !== 'boolean'
    )
      throw Error('INVALID_HISTORY');
  }
  if (
    d?.versaoContrato !== 1 ||
    d.versaoComplemento !== 'contextual-historico-1' ||
    d.compraId !== compraId ||
    d.persistido !== false ||
    d.escopoHistorico !==
      'ANTERIOR_A_DATA_REGISTRADA_SEM_EVENTOS_DO_MESMO_DIA' ||
    !date(d.consultadoEm) ||
    h?.versaoContrato !== 1 ||
    h.versaoIndicadores !== 'historicos-1' ||
    h.timezone !== 'UTC' ||
    !/^\d{4}-\d{2}$/.test(h.periodo) ||
    !date(h.janelaHistorico?.inicio) ||
    !date(h.observadoAte) ||
    Date.parse(h.janelaHistorico.inicio) > Date.parse(h.observadoAte) ||
    !count(h.qualidade?.comprasAtual) ||
    !count(h.qualidade?.comprasHistorico) ||
    !['COMPLETA', 'PARCIAL', 'DESCONHECIDA'].includes(h.qualidade.cobertura) ||
    !Array.isArray(h.frequencia?.periodos) ||
    h.frequencia.periodos.some(
      (p) => !/^\d{4}-\d{2}$/.test(p.periodo) || !count(p.compras),
    ) ||
    !count(h.frequencia.maiorConcentracao?.comprasPorDia) ||
    !Array.isArray(h.frequencia.distribuicaoDiaria) ||
    !count(h.valores?.atual?.semValor) ||
    !count(h.valores?.historico?.semValor) ||
    ![
      h.planejamento,
      h.planejamento?.historico,
      h.influenciaPromocional,
      h.influenciaPromocional?.historico,
    ].every(declaration) ||
    !Array.isArray(h.categorias) ||
    h.categorias.some(
      (c) =>
        typeof c.repeticaoObservada !== 'boolean' ||
        (c.nome !== undefined &&
          c.nome !== null &&
          typeof c.nome !== 'string') ||
        (c.valores !== undefined &&
          (!count(c.valores.comprasAtribuidas) ||
            !count(c.valores.totalLiquidoCentavos) ||
            !count(c.valores.comprasMulticategoriaSemRateio))),
    ) ||
    !count(h.recorrencias?.cadastradas) ||
    !count(h.recorrencias?.comprasVinculadasAtual) ||
    !count(h.recorrencias?.comprasVinculadasHistorico) ||
    !(
      h.intervalos?.medianaDiasEntreDatas === null ||
      (Number.isFinite(h.intervalos?.medianaDiasEntreDatas) &&
        h.intervalos.medianaDiasEntreDatas >= 0)
    ) ||
    !count(d.comparacaoValorCompra?.amostra) ||
    !(
      d.comparacaoValorCompra.medianaHistoricaCentavos === null ||
      Number.isFinite(d.comparacaoValorCompra.medianaHistoricaCentavos)
    ) ||
    r?.versaoRegras !== 'reflexoes-historicas-1' ||
    !['COM_REFLEXOES', 'DADOS_INSUFICIENTES'].includes(r.estado) ||
    !Array.isArray(r.itens) ||
    r.itens.some(
      (i) =>
        ![
          'FREQUENCIA',
          'DISTRIBUICAO',
          'VALORES',
          'CATEGORIAS',
          'PLANEJAMENTO',
          'PROMOCAO',
          'RECORRENCIAS',
        ].includes(i.codigo) ||
        !['REGISTRADO', 'DECLARADO', 'CONFIGURACAO_ATUAL'].includes(
          i.natureza,
        ) ||
        typeof i.observacao !== 'string' ||
        typeof i.reflexao !== 'string' ||
        !strings(i.referencias) ||
        !i.referencias.length ||
        !strings(i.indicadores) ||
        !i.indicadores.length,
    ) ||
    (r.estado === 'DADOS_INSUFICIENTES') !== (r.itens.length === 0) ||
    !strings(r.limitacoes) ||
    !strings(h.limitacoes) ||
    !/^[a-f0-9]{64}$/.test(dep?.fontesHash) ||
    dep.versaoRegras !== r.versaoRegras ||
    dep.versaoIndicadores !== h.versaoIndicadores ||
    !['contextual-1', 'contextual-2'].includes(dep.versaoMotorContextual) ||
    dep.periodo !== h.periodo ||
    dep.inicio !== h.janelaHistorico.inicio ||
    dep.fimExclusivo !== h.observadoAte ||
    d.contextual?.versaoMotor !== dep.versaoMotorContextual ||
    d.contextual.compraId !== compraId ||
    !count(d.contextual.contextoRevisao) ||
    dep.contextoRevisao !== d.contextual.contextoRevisao
  )
    throw Error('INVALID_HISTORY');
  return d;
}

// No persistent cache: each consultation is a new authenticated snapshot.
export function criarConsultaHistorico({
  compraId,
  revisao,
  client,
  storage,
  onChange,
}) {
  let disposed = false,
    generation = 0,
    controller,
    session,
    detach = () => {};
  const emit = (s) => {
    if (!disposed) onChange(s);
  };
  const invalidar = () => {
    generation++;
    controller?.abort();
    emit({ status: 'idle', dados: null });
  };
  const sessionLost = () => {
    invalidar();
    emit({ status: 'session', dados: null });
  };
  async function consultar() {
    invalidar();
    const id = generation;
    controller = new AbortController();
    const signal = controller.signal;
    emit({ status: 'loading', dados: null });
    try {
      const captured = session ?? (await storage.captureSession());
      if (disposed || id !== generation) return;
      if (!captured) throw Error('SESSION_REQUIRED');
      if (!session) {
        session = captured;
        session.signal.addEventListener('abort', sessionLost, { once: true });
        detach = () => session.signal.removeEventListener('abort', sessionLost);
      }
      if (session.signal.aborted) throw Error('SESSION_REQUIRED');
      storage.assertSession(session.id);
      const response = await client.get(
        `/v2/compras/${compraId}/indicadores-historicos`,
        { signal, rf017SessionId: session.id },
      );
      if (disposed || id !== generation || signal.aborted) return;
      storage.assertSession(session.id);
      const dados = validarHistoricoCompra(response.data, compraId);
      if (revisao !== undefined && dados.contextual.contextoRevisao !== revisao)
        throw Error('CONTEXT_CHANGED');
      emit({ status: 'ready', dados });
    } catch (error) {
      if (!disposed && id === generation)
        emit({
          status:
            error.message === 'SESSION_REQUIRED'
              ? 'session'
              : error.message === 'CONTEXT_CHANGED'
                ? 'conflict'
                : [404, 409].includes(error.response?.status)
                  ? 'unavailable'
                  : 'error',
          dados: null,
        });
    }
  }
  return {
    consultar,
    invalidar,
    dispose() {
      disposed = true;
      invalidar();
      detach();
    },
  };
}
