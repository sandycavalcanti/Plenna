// Adaptação de apresentação: nunca completa um resultado persistido com respostas atuais.
const fields = {
  planejamento: ['Planejamento', 'calendar-outline', {
    SIM: 'Planejada',
    PARCIALMENTE: 'Em parte',
    NAO: 'Não planejada'
  }],
  influenciaPromocional: ['Promoção', 'pricetag-outline', {
    SIM: 'Influenciou',
    NAO: 'Não influenciou'
  }],
  necessidadeInesperada: ['Necessidade', 'help-circle-outline', {
    SIM: 'Inesperada',
    NAO: 'Não surgiu'
  }],
  momento: ['Momento', 'time-outline', {
    ANTECIPADA: 'Antecipada',
    ADIADA: 'Adiada',
    NO_MOMENTO_PREVISTO: 'No momento previsto'
  }],
  autopercepcaoImpulsividade: ['Sua percepção', 'chatbubble-outline', {
    SIM: 'Percebeu impulso',
    NAO: 'Não percebeu impulso'
  }]
};
const uncertain = {
  NAO_LEMBRO: 'Não lembro',
  PREFIRO_NAO_RESPONDER: 'Prefiro não responder'
};
export const moedaAnalise = cents => (cents / 100).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});
export function separarReflexao(value) {
  if (!value) return {
    resultado: null,
    pergunta: null
  };
  // Só separa uma pergunta final. Um texto sem essa estrutura permanece integral.
  const split = value.match(/^([\s\S]+?[.!])\s+([^?]+\?)$/);
  return split ? {
    resultado: split[1],
    pergunta: split[2]
  } : value.endsWith('?') ? {
    resultado: null,
    pergunta: value
  } : {
    resultado: value,
    pergunta: null
  };
}
export function apresentarAvaliacao(envelope, revisao) {
  const r = envelope?.resultado;
  const stale = envelope?.atualidade === 'DESATUALIZADA' || revisao !== undefined && r && r.contextoRevisao !== revisao;
  if (!r || stale) return {
    stale,
    resultado: null,
    pergunta: null,
    fatores: [],
    declaracoes: [],
    observacoes: [],
    rastreio: null
  };
  const split = separarReflexao(r.interpretacao.reflexao);
  const used = new Set(r.interpretacao.referencias);
  const rules = r.regrasAplicadas;
  const declarations = [...r.declaracoes, ...(r.autopercepcao ? [r.autopercepcao] : [])];
  const mapped = declarations.map(d => {
    const field = fields[d.campo];
    const applied = rules.some(rule => rule.codigo === d.codigo && rule.referencias.some(ref => d.referencias.includes(ref)));
    const itemName = d.campo === 'planejamentoItem' && d.mensagem.includes(': planejamento declarado como ') ? d.mensagem.split(': planejamento declarado como ')[0] : null;
    return {
      ...d,
      titulo: field?.[0] ?? (itemName && !/^Item \d+$/.test(itemName) ? itemName : null) ?? (d.itemId ? 'Item registrado' : 'Declaração'),
      icone: field?.[1] ?? 'layers-outline',
      valorCurto: uncertain[d.valor] ?? field?.[2][d.valor] ?? {
        SIM: 'Planejado',
        NAO: 'Não planejado',
        PARCIALMENTE: 'Em parte'
      }[d.valor] ?? d.valor,
      utilizada: applied && d.referencias.some(ref => used.has(ref)) && !uncertain[d.valor]
    };
  });
  const factors = mapped.filter(d => d.utilizada && d.campo !== 'planejamentoItem');
  const items = mapped.filter(d => d.utilizada && d.campo === 'planejamentoItem');
  if (items.length) {
    const counts = [['SIM', 'planejado', 'planejados'], ['PARCIALMENTE', 'em parte', 'em parte'], ['NAO', 'não planejado', 'não planejados']].map(([value, singular, plural]) => {
      const count = items.filter(i => i.valor === value).length;
      return count ? `${count} ${count === 1 ? singular : plural}` : null;
    }).filter(Boolean);
    factors.push({
      codigo: 'ITENS',
      titulo: 'Itens',
      icone: 'layers-outline',
      valorCurto: counts.join(' · '),
      referencias: items.flatMap(i => i.referencias)
    });
  }
  return {
    stale: false,
    resultado: split.resultado ?? r.interpretacao.mensagem,
    pergunta: split.pergunta,
    fatores: factors,
    declaracoes: mapped,
    observacoes: r.observacoes,
    significado: r.interpretacao.mensagem,
    rastreio: {
      avaliacaoId: envelope.avaliacaoId,
      criadaEm: envelope.criadaEm,
      versao: r.versaoMotor,
      revisao: r.contextoRevisao,
      regras: r.regrasAplicadas,
      evidencias: r.evidencias,
      limitacoes: r.limitacoes
    }
  };
}
export function apresentarReferenciaComplementar(d, compraId) {
  if (d?.versaoContrato !== 1 || d.compraId !== compraId || d.disponivel !== true || !Number.isSafeInteger(d.compraCentavos) || d.compraCentavos < 0) return null;
  const valid = value => Number.isSafeInteger(value) && value > 0;
  return {
    compra: d.compraCentavos,
    atual: valid(d.limiteAtualCentavos) ? {
      valor: d.limiteAtualCentavos,
      diferenca: d.compraCentavos - d.limiteAtualCentavos
    } : null,
    historica: d.historicoComprovado === true && valid(d.limiteHistoricoCentavos) ? {
      valor: d.limiteHistoricoCentavos,
      diferenca: d.compraCentavos - d.limiteHistoricoCentavos
    } : null
  };
}
