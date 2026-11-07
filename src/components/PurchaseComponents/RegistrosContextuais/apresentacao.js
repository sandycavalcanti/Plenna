import { resumoDeclarado } from '../ContextoCompra/fluxo.js';
const campos = resumoDeclarado({});
const rotulo = (campo, valor) => resumoDeclarado({
  [campo]: valor
}).find(f => f.campo === campo)?.valor ?? valor;
const itensValores = {
  SIM: 'Planejado',
  PARCIALMENTE: 'Em parte',
  NAO: 'Não planejado',
  NAO_LEMBRO: 'Não lembro',
  PREFIRO_NAO_RESPONDER: 'Prefiro não responder'
};
const eventos = {
  ARREPENDIMENTO: ['Arrependimento', 'shield-checkmark-outline'],
  CANCELAMENTO: ['Cancelamento', 'close-circle-outline'],
  DEVOLUCAO: ['Devolução', 'return-down-back-outline'],
  REEMBOLSO: ['Reembolso', 'cash-outline']
};
export function dataHistorico(value) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short'
  }) : 'Data não disponível';
}
export function trechosHistoricos(value) {
  if (!value) return {
    resultado: null,
    pergunta: null,
    original: value
  };
  const match = value.match(/^([\s\S]+[.!])\s+([^.!?]+\?)$/);
  if (match) return {
    resultado: match[1],
    pergunta: match[2],
    original: value
  };
  return value.trim().endsWith('?') ? {
    resultado: null,
    pergunta: value,
    original: value
  } : {
    resultado: value,
    pergunta: null,
    original: value
  };
}
export function apresentarContextoHistorico(row, previous) {
  const anterior = previous?.revisao === row.revisao - 1 ? previous : null;
  const rows = [],
    ausentes = [];
  let alteracoes = 0;
  for (const f of campos) {
    const value = row.respostas[f.campo],
      old = anterior?.respostas[f.campo];
    const changed = !!anterior && value !== old;
    if (changed) alteracoes++;
    if (value !== undefined || changed) rows.push({
      id: f.campo,
      label: f.titulo,
      icone: f.icone,
      value: rotulo(f.campo, value),
      antes: changed ? rotulo(f.campo, old) : null
    });else ausentes.push(f.titulo);
  }
  const currentItems = new Map(row.itens.map(i => [i.itemId, i.planejamento]));
  const oldItems = new Map((anterior?.itens ?? []).map(i => [i.itemId, i.planejamento]));
  const itemIds = [...new Set([...currentItems.keys(), ...oldItems.keys()])].sort((a, b) => a - b);
  const items = itemIds.map(itemId => {
    const value = currentItems.get(itemId),
      old = oldItems.get(itemId),
      changed = !!anterior && value !== old;
    if (changed) alteracoes++;
    // Contexto histórico não guarda nome do produto; não usa o nome atual como histórico.
    return {
      id: `item:${itemId}`,
      label: 'Item registrado',
      icone: 'layers-outline',
      value: itensValores[value] ?? 'Não informado',
      antes: changed ? itensValores[old] ?? 'Não informado' : null
    };
  });
  for (const [codigo, [label, icone]] of Object.entries(eventos)) {
    const present = row.eventosPosteriores?.includes(codigo) === true;
    const old = anterior?.eventosPosteriores?.includes(codigo) === true;
    const changed = !!anterior && present !== old;
    if (changed) alteracoes++;
    if (present || changed || codigo === 'ARREPENDIMENTO') rows.push({
      id: codigo,
      label,
      icone,
      value: present ? 'Informado' : 'Não informado',
      antes: changed ? old ? 'Informado' : 'Não informado' : null
    });
  }
  return {
    rows,
    items,
    ausentes,
    alteracoes
  };
}
function linhaDeclaracao(d) {
  if (d.campo === 'planejamentoItem') {
    const marker = ': planejamento declarado como ';
    const snapshotName = d.mensagem.includes(marker) ? d.mensagem.split(marker)[0].trim() : null;
    const name = snapshotName && !/^Item \d+$/.test(snapshotName) ? snapshotName : 'Item registrado';
    return {
      id: `item:${d.itemId ?? d.referencias.join(':')}`,
      label: name,
      icone: 'layers-outline',
      value: itensValores[d.valor] ?? d.valor,
      itemId: d.itemId
    };
  }
  const f = campos.find(f => f.campo === d.campo);
  return f ? {
    id: d.campo,
    label: f.titulo,
    icone: f.icone,
    value: rotulo(d.campo, d.valor)
  } : {
    id: d.codigo + ':' + d.referencias.join(':'),
    label: 'Outra resposta',
    icone: 'chatbubble-outline',
    value: d.mensagem
  };
}

// Projeção estritamente histórica: não usa compositor de insights nem dados atuais.
export function apresentarAvaliacaoHistorica(resultado, explicacao) {
  const reflection = resultado?.interpretacao.reflexao ?? explicacao?.reflexao;
  const text = trechosHistoricos(reflection);
  const declarations = resultado ? [...resultado.declaracoes, ...(resultado.autopercepcao ? [resultado.autopercepcao] : [])] : explicacao?.fatores.filter(f => f.natureza === 'DECLARADO') ?? [];
  const refs = new Set(resultado?.interpretacao.referencias ?? explicacao?.referenciasResumo ?? []);
  const rules = resultado?.regrasAplicadas ?? explicacao?.regrasAplicadas ?? [];
  const fatores = [],
    outras = [];
  for (const d of declarations) {
    const line = linhaDeclaracao(d);
    if (!line) continue;
    const applied = rules.some(rule => rule.codigo === d.codigo && rule.referencias.some(ref => d.referencias.includes(ref)));
    const used = applied && d.referencias.some(ref => refs.has(ref)) && !['NAO_LEMBRO', 'PREFIRO_NAO_RESPONDER'].includes(d.valor);
    (used ? fatores : outras).push(line);
  }
  const observacoes = resultado?.observacoes ?? explicacao?.fatores.filter(f => f.natureza === 'INTERPRETADO') ?? [];
  const complementos = observacoes.map((o, i) => ({
    id: `observacao:${i}`,
    texto: o.mensagem.split('. ')[0].replace(/\.$/, '') + '.'
  }));
  return {
    resultado: text.resultado,
    pergunta: text.pergunta,
    reflexaoOriginal: reflection,
    fatores,
    outras,
    complementos,
    ausentes: campos.filter(f => !declarations.some(d => d.campo === f.campo)).map(f => f.titulo),
    resumo: resultado?.interpretacao.mensagem ?? explicacao?.resumo ?? null,
    estado: resultado?.estado ?? null,
    limitacoes: resultado?.limitacoes ?? explicacao?.limitacoes ?? []
  };
}
