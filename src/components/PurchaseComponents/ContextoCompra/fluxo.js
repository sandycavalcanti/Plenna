export function etapasContexto(
  dados,
  respostas = {},
  itens = {},
  revisar = false,
  prioridades = [],
) {
  if (!dados?.perguntas) return [];
  const r = { ...dados.contexto.respostas };
  for (const [k, v] of Object.entries(respostas)) {
    if (v === null) delete r[k];
    else r[k] = v;
  }
  const invited = new Set(dados.perguntas.perguntas.map((q) => q.codigo));
  const questions = dados.perguntas.catalogo
    .filter((q) => {
      if (revisar) return true;
      if (
        q.campo === 'momento' &&
        !['SIM', 'PARCIALMENTE'].includes(r.planejamento) &&
        r.influenciaPromocional !== 'SIM'
      )
        return false;
      if (Object.hasOwn(respostas, q.campo)) return true;
      if (dados.contexto.respostas[q.campo] !== undefined) return false;
      return (
        invited.has(q.codigo) ||
        (q.campo === 'momento' &&
          (Object.hasOwn(respostas, 'planejamento') ||
            Object.hasOwn(respostas, 'influenciaPromocional')))
      );
    })
    .map((q) => ({ ...q, key: q.codigo }));
  if (revisar || r.planejamento === 'PARCIALMENTE')
    for (const item of dados.perguntas.itens) {
      const invitedItem = dados.perguntas.perguntas.some(
        (q) => q.codigo === 'planejamentoItem' && q.itemId === item.itemId,
      );
      if (
        revisar ||
        Object.hasOwn(itens, item.itemId) ||
        (!dados.contexto.itens.some((i) => i.itemId === item.itemId) &&
          (invitedItem || Object.hasOwn(respostas, 'planejamento')))
      )
        questions.push({
          key: `item:${item.itemId}`,
          campo: 'planejamento',
          texto: `E ${item.nome}, estava nos seus planos?`,
          itemId: item.itemId,
          opcoes: dados.perguntas.planejamentoItemOpcoes,
        });
    }
  return revisar
    ? questions
    : questions.sort((a, b) => {
        const rank = (q) => {
          const i = prioridades.indexOf(q.campo);
          return i < 0 ? prioridades.length : i;
        };
        return rank(a) - rank(b);
      });
}
export const rotuloOpcao = (o) =>
  o.valor === 'PARCIALMENTE' ? 'Em parte' : o.texto;
export function resumoDeclarado(respostas) {
  const known = {
    planejamento: {
      SIM: 'Planejada',
      PARCIALMENTE: 'Em parte',
      NAO: 'Não planejada',
    },
    influenciaPromocional: { SIM: 'Influenciou', NAO: 'Não influenciou' },
    autopercepcaoImpulsividade: {
      SIM: 'Percebi impulso',
      NAO: 'Não percebi impulso',
    },
  };
  return [
    {
      campo: 'planejamento',
      titulo: 'Planejamento',
      icone: 'calendar-outline',
    },
    {
      campo: 'influenciaPromocional',
      titulo: 'Promoção',
      icone: 'pricetag-outline',
    },
    {
      campo: 'autopercepcaoImpulsividade',
      titulo: 'Sua percepção',
      icone: 'chatbubble-outline',
    },
  ].map((i) => ({
    ...i,
    informado: respostas[i.campo] !== undefined,
    valor:
      known[i.campo][respostas[i.campo]] ??
      {
        NAO_LEMBRO: 'Não lembro',
        PREFIRO_NAO_RESPONDER: 'Prefiro não responder',
      }[respostas[i.campo]] ??
      'Não informado',
  }));
}
// Rascunhos ficam apenas na memória da sessão; respostas privadas não são gravadas no armazenamento desprotegido.
export function criarRascunhos() {
  const entries = new Map(),
    listeners = new Map();
  const key = (s, id) => `${s}:${id}`;
  function bind(session) {
    const old = listeners.get(session.id);
    if (old?.signal === session.signal) return;
    if (old) {
      old.signal.removeEventListener('abort', old.clear);
      old.clear();
    }
    const clear = () => {
      for (const k of entries.keys())
        if (k.startsWith(`${session.id}:`)) entries.delete(k);
      listeners.delete(session.id);
    };
    session.signal.addEventListener('abort', clear, { once: true });
    listeners.set(session.id, { signal: session.signal, clear });
  }
  return {
    ler(session, id, revisao) {
      if (session.signal.aborted) return null;
      bind(session);
      const v = entries.get(key(session.id, id));
      return v?.revisao === revisao ? v : null;
    },
    salvar(session, id, value) {
      if (session.signal.aborted) return;
      bind(session);
      entries.set(key(session.id, id), value);
    },
    limpar(session, id) {
      if (session) entries.delete(key(session.id, id));
    },
  };
}
export const rascunhosContexto = criarRascunhos();
