import { validarAvaliacao } from '../../../services/avaliacaoCompraService.js';

// Camada derivada, sem escrita e independente das oito regras persistidas.
const campos = {
  planejamento: {
    regra: 'R2_PLANEJAMENTO',
    titulo: 'Planejamento',
    icone: 'calendar-outline',
    valores: {
      SIM: 'Planejada',
      PARCIALMENTE: 'Em parte',
      NAO: 'Não planejada'
    }
  },
  influenciaPromocional: {
    regra: 'R4_PROMOCAO',
    titulo: 'Promoção',
    icone: 'pricetag-outline',
    valores: {
      SIM: 'Influenciou',
      NAO: 'Não influenciou'
    }
  },
  necessidadeInesperada: {
    regra: 'R5_NECESSIDADE',
    titulo: 'Necessidade',
    icone: 'help-circle-outline',
    valores: {
      SIM: 'Inesperada',
      NAO: 'Não surgiu'
    }
  },
  momento: {
    regra: 'R6_MOMENTO',
    titulo: 'Momento',
    icone: 'time-outline',
    valores: {
      ANTECIPADA: 'Antecipada',
      ADIADA: 'Adiada',
      NO_MOMENTO_PREVISTO: 'No momento previsto'
    }
  },
  autopercepcaoImpulsividade: {
    regra: 'R8_AUTOPERCEPCAO',
    titulo: 'Sua percepção',
    icone: 'chatbubble-outline',
    valores: {
      SIM: 'Percebeu impulso',
      NAO: 'Não percebeu impulso'
    }
  },
  planejamentoItem: {
    regra: 'R3_ITEM',
    titulo: 'Itens',
    icone: 'layers-outline',
    valores: {
      SIM: 'Planejado',
      PARCIALMENTE: 'Em parte',
      NAO: 'Não planejado'
    }
  }
};
const planejamento = {
  SIM: 'A compra estava nos seus planos',
  PARCIALMENTE: 'Parte da compra estava nos seus planos',
  NAO: 'A compra não estava nos seus planos'
};
const momento = {
  ANTECIPADA: 'a compra foi antecipada',
  ADIADA: 'a compra foi adiada',
  NO_MOMENTO_PREVISTO: 'o momento previsto foi mantido'
};
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const grupo = e => e.campo === 'planejamentoItem' ? 'itens' : e.campo;
const grupos = evidencias => [...new Set(evidencias.map(grupo))];
function normalizar(envelope, itensPermitidos) {
  const r = envelope.resultado,
    prefix = `contexto:${r.compraId}:revisao:${r.contextoRevisao}:`;
  const sources = [...r.declaracoes, ...(r.autopercepcao ? [r.autopercepcao] : [])];
  const entries = new Map(),
    conflicts = new Set();
  for (const d of sources) {
    const c = campos[d.campo];
    if (!c) continue;
    const item = d.campo === 'planejamentoItem';
    if (item && (!Number.isSafeInteger(d.itemId) || d.itemId < 1 || itensPermitidos && !itensPermitidos.includes(d.itemId))) continue;
    const ref = prefix + (item ? `item:${d.itemId}` : d.campo);
    if (d.codigo !== c.regra || !d.referencias.includes(ref) || !r.evidencias.some(e => e.referencia === ref && e.natureza === 'DECLARADO') || !r.regrasAplicadas.some(rule => rule.codigo === c.regra && rule.referencias.includes(ref))) continue;
    const id = item ? `item:${d.itemId}` : d.campo;
    const prior = entries.get(id);
    if (prior && prior.valor !== d.valor) conflicts.add(id);
    entries.set(id, {
      id,
      campo: d.campo,
      valor: d.valor,
      itemId: d.itemId,
      referencias: [ref],
      regra: c.regra,
      origem: 'AVALIACAO_REGISTRADA',
      avaliacaoId: envelope.avaliacaoId,
      titulo: c.titulo,
      icone: c.icone,
      valorCurto: c.valores[d.valor]
    });
  }
  // Ausência, remoção, recusa e desconhecimento nunca viram valores afirmativos.
  const evidencias = [...entries.values()].filter(e => !conflicts.has(e.id) && e.valorCurto).sort((a, b) => compare(a.id, b.id));
  const financeiras = r.observacoes.filter(o => ['LIMITE_EXCEDIDO', 'SEM_EXCESSO_CONHECIDO'].includes(o.codigo) && ['compra:' + r.compraId, 'perfil:limite-atual'].every(ref => o.referencias.includes(ref) && r.regrasAplicadas.some(rule => rule.codigo === 'R1_LIMITE' && rule.referencias.includes(ref))) && r.evidencias.some(e => e.referencia === `compra:${r.compraId}` && e.natureza === 'REGISTRADO') && r.evidencias.some(e => e.referencia === 'perfil:limite-atual' && e.natureza === 'DECLARADO'));
  const financeiro = new Set(financeiras.map(o => o.codigo + ':' + o.mensagem)).size === 1 ? financeiras[0] : null;
  if (financeiro) evidencias.push({
    id: 'financeiro',
    campo: 'financeiro',
    valor: financeiro.codigo,
    titulo: 'Comparação financeira',
    icone: 'wallet-outline',
    valorCurto: financeiro.codigo === 'LIMITE_EXCEDIDO' ? 'Acima da referência no cálculo' : 'Sem excesso no cálculo',
    mensagem: financeiro.mensagem.split('. ')[0].replace(/\.$/, '') + '.',
    referencias: [...financeiro.referencias],
    regra: 'R1_LIMITE',
    origem: 'AVALIACAO_REGISTRADA',
    avaliacaoId: envelope.avaliacaoId
  });
  return {
    evidencias,
    conflitos: conflicts.size
  };
}
export function fatoresDoInsight(insight) {
  if (!insight) return [];
  const result = insight.evidencias.filter(e => e.campo !== 'planejamentoItem');
  const items = insight.evidencias.filter(e => e.campo === 'planejamentoItem');
  if (items.length) result.push({
    id: 'itens',
    campo: 'itens',
    titulo: 'Itens com resposta',
    icone: 'layers-outline',
    valorCurto: [['SIM', 'planejado', 'planejados'], ['PARCIALMENTE', 'em parte', 'em parte'], ['NAO', 'não planejado', 'não planejados']].map(([value, singular, plural]) => {
      const count = items.filter(e => e.valor === value).length;
      return count ? `${count} ${count === 1 ? singular : plural}` : null;
    }).filter(Boolean).join(' · '),
    referencias: items.flatMap(e => e.referencias)
  });
  return result;
}
export function comporInsightsContextuais(envelope, {
  compraId = envelope?.compraId,
  revisao,
  indisponibilidade,
  itensPermitidos
} = {}) {
  const origem = {
    tipo: 'INSIGHT_DERIVADO',
    versao: 'compositor-contextual-1',
    avaliacaoId: envelope?.avaliacaoId ?? null,
    compraId,
    contextoRevisao: envelope?.resultado?.contextoRevisao ?? null
  };
  const vazio = (estado, motivo) => ({
    estado,
    motivo,
    origem,
    principal: null,
    complementares: []
  });
  if (indisponibilidade) return vazio('INDISPONIVEL', indisponibilidade);
  if (!envelope) return vazio('SEM_EVIDENCIAS', 'SEM_AVALIACAO');
  try {
    validarAvaliacao(envelope, compraId);
  } catch {
    return vazio('INVALIDO', 'ORIGEM_NAO_VERIFICADA');
  }
  if (envelope.atualidade === 'DESATUALIZADA' || envelope.resultado && (envelope.motivos.length > 0 || revisao !== undefined && envelope.resultado.contextoRevisao !== revisao)) return vazio('DESATUALIZADO', 'ATUALIZACAO_NECESSARIA');
  if (!envelope.resultado) return vazio('SEM_EVIDENCIAS', 'SEM_AVALIACAO');
  if (!Number.isSafeInteger(envelope.avaliacaoId) || envelope.avaliacaoId < 1 || !envelope.criadaEm) return vazio('INVALIDO', 'AVALIACAO_SEM_IDENTIDADE');
  if (envelope.atualidade !== 'VIGENTE' || envelope.resultado.estado === 'NAO_AVALIAVEL') return vazio('INDISPONIVEL', 'COMPRA_NAO_AVALIAVEL');
  const {
    evidencias,
    conflitos
  } = normalizar(envelope, itensPermitidos);
  const get = campo => evidencias.find(e => e.campo === campo);
  const p = get('planejamento'),
    n = get('necessidadeInesperada'),
    o = get('influenciaPromocional'),
    m = get('momento'),
    a = get('autopercepcaoImpulsividade');
  const items = evidencias.filter(e => e.campo === 'planejamentoItem'),
    candidates = [];
  function add(tipo, titulo, reflexao, pergunta, used, relacao, contraste = 0, especificidade = 1) {
    const unique = [...new Map(used.map(e => [e.id, e])).values()].sort((a, b) => compare(a.id, b.id));
    candidates.push({
      id: `${origem.versao}:${origem.avaliacaoId}:${tipo}`,
      tipo,
      titulo,
      reflexao,
      pergunta,
      evidencias: unique,
      relacao,
      significado: 'A reflexão se limita às evidências listadas. Ela não determina impulsividade nem altera sua classificação.',
      origem,
      estado: 'VALIDO',
      criterios: {
        fatores: grupos(unique).length,
        contraste,
        especificidade
      }
    });
  }
  if (p && p.valor !== 'NAO' && o?.valor === 'SIM' && m) add('PLANEJAMENTO_PROMOCAO_MOMENTO', 'Planos, oferta e momento', `${planejamento[p.valor]}; houve influência de uma promoção e ${momento[m.valor]}.`, m.valor === 'ANTECIPADA' ? 'Você teria comprado agora se a oferta não existisse?' : m.valor === 'ADIADA' ? 'O que ajudou a adiar a compra, mesmo com a oferta?' : 'O que ajudou a manter o momento previsto?', [p, o, m], 'Planejamento, promoção e momento foram declarados juntos. Isso não prova que a oferta causou a mudança.', 0, 3);
  if (p && n?.valor === 'SIM') add('NECESSIDADE_PLANEJAMENTO', 'Uma necessidade fora do previsto', `${planejamento[p.valor]} e surgiu uma necessidade inesperada.`, 'O que ajudaria a se preparar para uma necessidade semelhante?', [p, n], 'Necessidade inesperada e planejamento podem coexistir. Falta de planejamento, sozinha, não determina impulso.', p.valor === 'NAO' ? 1 : 0, 2);
  const different = items.filter(e => p?.valor === 'SIM' ? e.valor !== 'SIM' : p?.valor === 'NAO' ? e.valor !== 'NAO' : true);
  if (p && different.length) {
    const counts = fatoresDoInsight({
      evidencias: different
    })[0].valorCurto;
    add('PLANEJAMENTO_ITENS', p.valor === 'PARCIALMENTE' ? 'Planejamento geral e dos itens' : 'Planos diferentes entre os itens', `${planejamento[p.valor]}; entre os itens com resposta, há ${counts}.`, p.valor === 'NAO' ? 'Como o planejamento desses itens se encaixou numa compra que não estava nos planos?' : 'Como o planejamento de cada item se relacionou com seus planos para a compra?', [p, ...different], 'A resposta geral e as respostas dos itens têm escopos diferentes. Itens sem contexto não foram presumidos.', p.valor === 'PARCIALMENTE' ? 0 : 1, 3);
  }
  if (o?.valor === 'SIM' && n?.valor === 'SIM') add('PROMOCAO_NECESSIDADE', 'Necessidade e oportunidade', 'Houve uma necessidade inesperada e uma promoção também influenciou a decisão.', 'A oferta mudou sua escolha para atender essa necessidade?', [o, n], 'As duas influências foram declaradas; não é possível dizer que a promoção foi determinante.', 0, 2);
  if (p && o?.valor === 'SIM') add('PLANEJAMENTO_PROMOCAO', 'Seus planos e a oferta', `${planejamento[p.valor]} e uma promoção influenciou a decisão.`, 'Sem a oferta, o que mudaria na sua escolha?', [p, o], 'Planejamento e influência promocional foram declarados. A combinação não define uma classificação.', 0, 2);
  if (o?.valor === 'SIM' && m) add('PROMOCAO_MOMENTO', 'A oferta e o momento', `Uma promoção influenciou a decisão e ${momento[m.valor]}.`, 'Que outros motivos contribuíram para escolher esse momento?', [o, m], 'Influência promocional e momento foram relatados juntos, sem comprovar uma relação de causa e efeito.', 0, 2);
  if (p && p.valor !== 'NAO' && m) add('MOMENTO_PLANEJAMENTO', 'Planejamento e momento', `${planejamento[p.valor]} e ${momento[m.valor]}.`, m.valor === 'NO_MOMENTO_PREVISTO' ? 'O que ajudou a manter seu planejamento?' : 'O que contribuiu para mudar o momento previsto?', [p, m], 'O planejamento geral e o momento descrevem aspectos diferentes da mesma decisão.', 0, 2);
  if (a && (p || n?.valor === 'SIM')) {
    const context = p ?? n;
    add('AUTOPERCEPCAO_CONTEXTO', 'Sua percepção no contexto', `${p ? planejamento[p.valor] : 'Surgiu uma necessidade inesperada'} e você ${a.valor === 'SIM' ? 'percebeu' : 'não percebeu'} impulso na decisão.`, 'Que aspecto da decisão mais contribuiu para essa percepção?', [context, a], 'Sua autopercepção é uma declaração voluntária. Ela não é corrigida nem substituída por uma conclusão automática.', 0, 2);
  }
  const singles = {
    planejamento: ['Seus planos para a compra', e => `${planejamento[e.valor]}.`, 'O resultado correspondeu ao que você pretendia?'],
    influenciaPromocional: ['O papel da oferta', e => e.valor === 'SIM' ? 'Uma promoção fez parte dos motivos da sua escolha.' : 'A decisão não foi influenciada por uma promoção.', 'O que mais pesou na sua escolha?'],
    necessidadeInesperada: ['Uma necessidade na decisão', e => e.valor === 'SIM' ? 'A compra surgiu com uma necessidade inesperada.' : 'Não houve uma necessidade inesperada declarada.', 'O que foi importante para decidir comprar?'],
    momento: ['O momento escolhido', e => `${momento[e.valor][0].toUpperCase() + momento[e.valor].slice(1)}.`, 'O que ajudou a escolher esse momento?'],
    autopercepcaoImpulsividade: ['Sua percepção da decisão', e => `Você ${e.valor === 'SIM' ? 'percebeu' : 'não percebeu'} impulso na decisão.`, 'O que mais contribuiu para essa percepção?']
  };
  for (const e of evidencias.filter(e => singles[e.campo])) {
    const [title, phrase, question] = singles[e.campo];
    add(`DECLARACAO_${e.campo}`, title, phrase(e), question, [e], 'Só esta informação foi usada; não há evidências suficientes para relacioná-la a outros fatores.');
  }
  if (items.length) add('ITENS_DECLARADOS', 'Planejamento dos itens', `Entre os itens com resposta: ${fatoresDoInsight({
    evidencias: items
  })[0].valorCurto}.`, 'O que orientou a escolha desses itens?', items, 'A reflexão considera somente os itens respondidos; não representa toda a compra.');
  const f = get('financeiro');
  if (f) add('REFERENCIA_FINANCEIRA', 'Uma comparação de valor', f.mensagem, 'Como essa comparação se relaciona com seus planos?', [f], 'É a comparação registrada no cálculo. A referência utilizada não comprova um limite vigente na data da compra.', 0, 2);

  // Ordem lexicográfica de critérios explicáveis, nunca probabilidade psicológica.
  candidates.sort((a, b) => b.criterios.fatores - a.criterios.fatores || b.criterios.contraste - a.criterios.contraste || b.criterios.especificidade - a.criterios.especificidade || compare(a.tipo, b.tipo));
  const principal = candidates[0];
  if (!principal) return vazio('SEM_EVIDENCIAS', conflitos ? 'EVIDENCIAS_CONFLITANTES' : 'CONTEXTO_INSUFICIENTE');
  const used = new Set(grupos(principal.evidencias)),
    complementares = [];
  for (const candidate of candidates.slice(1)) {
    if (candidate.criterios.fatores < 2 && candidate.tipo !== 'REFERENCIA_FINANCEIRA') continue;
    const fresh = grupos(candidate.evidencias).filter(g => !used.has(g));
    if (!fresh.length) continue;
    complementares.push(candidate);
    fresh.forEach(g => used.add(g));
    if (complementares.length === 2) break;
  }
  return {
    estado: 'VALIDO',
    motivo: null,
    origem,
    principal,
    complementares
  };
}
