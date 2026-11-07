const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const nCompras = n => `${n} ${n === 1 ? 'compra' : 'compras'}`;
export function classificacoesPeriodo(d) {
  const a = d.sinais?.find(v => v.codigo === 'CLASSIFICADA_IMPULSIVA'),
    b = d.sinais?.find(v => v.codigo === 'CLASSIFICADA_NAO_IMPULSIVA');
  if (!a || !b || a.validos !== b.validos || a.condicao + b.condicao !== a.validos || a.validos > d.universo) return null;
  return {
    impulsivas: a.condicao,
    naoImpulsivas: b.condicao,
    semClassificacao: d.universo - a.validos
  };
}
const civil = value => {
  const v = value.includes('/') ? value.split('/').reverse() : value.split('-');
  return {
    ano: v[0],
    mes: Number(v[1]) - 1,
    dia: Number(v[2])
  };
};
export function periodoLegivel(f) {
  if (f.modo === 'TODOS') return 'Todo o histórico';
  if (f.modo === 'MES') {
    const [ano, mes] = f.mes.split('-');
    const nome = meses[Number(mes) - 1];
    return `${nome[0].toUpperCase()}${nome.slice(1)} de ${ano}`;
  }
  const a = civil(f.inicio),
    b = civil(f.fim);
  if (a.ano === b.ano && a.mes === b.mes) return `${String(a.dia).padStart(2, '0')} a ${String(b.dia).padStart(2, '0')} de ${meses[a.mes]} de ${a.ano}`;
  const format = v => `${String(v.dia).padStart(2, '0')} de ${meses[v.mes]} de ${v.ano}`;
  return `${format(a)} a ${format(b)}`;
}
export function consultaLegivel(value) {
  if (!value) return null;
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map(v => [v.type, v.value]));
  return `Dados consultados em ${p.day}/${p.month}, às ${p.hour}h${p.minute}`;
}
const fatores = {
  PLANEJADA: ['Planejamento', 'calendar-outline', 'planejada integralmente', 'planejadas integralmente', 'Planejamento informado para a compra como um todo.'],
  PARCIAL: ['Planejamento parcial', 'calendar-outline', 'parcialmente planejada', 'parcialmente planejadas', 'Parte da compra estava nos planos.'],
  NAO_PLANEJADA: ['Sem planejamento', 'calendar-outline', 'sem planejamento declarado', 'sem planejamento declarado', 'Você informou que a compra não estava planejada.'],
  PROMOCAO: ['Promoções', 'pricetag-outline', 'com influência promocional declarada', 'com influência promocional declarada', 'Influência de ofertas informada por você.'],
  NECESSIDADE: ['Necessidades inesperadas', 'alert-circle-outline', 'por necessidade inesperada declarada', 'por necessidade inesperada declarada', 'Necessidade inesperada informada por você.'],
  ANTECIPADA: ['Antecipação', 'time-outline', 'feita antes do previsto', 'feitas antes do previsto', 'Você informou ter antecipado a compra.'],
  ADIADA: ['Adiamento', 'time-outline', 'feita depois do previsto', 'feitas depois do previsto', 'Você informou ter adiado a compra.'],
  IMPULSO: ['Autopercepção de impulso', 'flash-outline', 'com percepção de impulso declarada', 'com percepção de impulso declarada', 'Sua percepção de impulso, separada da classificação voluntária.'],
  SEM_IMPULSO: ['Sem impulso percebido', 'leaf-outline', 'sem percepção de impulso declarada', 'sem percepção de impulso declarada', 'Você respondeu que não percebeu impulso. Isso não é uma classificação automática.']
};
export function fatoresPeriodo(sinais) {
  const familias = [['PLANEJADA', 'PARCIAL', 'NAO_PLANEJADA'], ['PROMOCAO'], ['ANTECIPADA', 'ADIADA'], ['NECESSIDADE'], ['IMPULSO', 'SEM_IMPULSO']];
  return familias.map(codes => sinais.filter(s => codes.includes(s.codigo) && s.validos > 0).sort((a, b) => b.condicao - a.condicao || a.codigo.localeCompare(b.codigo))[0]).filter(Boolean).sort((a, b) => b.condicao - a.condicao || b.validos - a.validos || a.codigo.localeCompare(b.codigo)).map(v => {
    const [nome, icone, singular, plural, significado] = fatores[v.codigo];
    return {
      ...v,
      nome,
      icone,
      significado,
      descricao: v.condicao ? `${nCompras(v.condicao)} ${v.condicao === 1 ? singular : plural}.` : 'Nenhuma ocorrência declarada nas respostas válidas.'
    };
  });
}
export function detalheFator(v, universo) {
  const ausencia = universo - v.validos;
  const negativa = ['PROMOCAO', 'NECESSIDADE'].includes(v.codigo) ? `${nCompras(v.validos - v.condicao)} com resposta “não”.` : 'As outras respostas válidas correspondem às demais opções desta pergunta.';
  return [`${nCompras(v.validos)} com resposta válida sobre este fator.`, negativa, `${nCompras(ausencia)} sem resposta válida; ausência, recusa e “não lembro” não são respostas negativas.`];
}
const relacoes = {
  PROMOCAO_ANTECIPACAO: ['Promoção', 'Antecipação', 'Ofertas e momento da compra', 'Essas compras já estavam nos planos antes das ofertas?'],
  PROMOCAO_IMPULSO: ['Promoção', 'Impulso percebido', 'Ofertas e autopercepção', 'Ao olhar essas compras em conjunto, o que ajudaria a decidir com mais calma?'],
  PARCIAL_ITENS: ['Planejamento parcial', 'Itens não planejados', 'Planos e escolhas adicionais', 'O que os itens adicionais dessas compras têm em comum?'],
  NECESSIDADE_SEM_PLANO: ['Necessidade inesperada', 'Sem planejamento', 'Necessidades fora dos planos', 'Que necessidades se repetiram e poderiam entrar no próximo planejamento?']
};
// Ranks evidence, never people: recurrence, share, then coverage. Stable ties.
export function comporPeriodo(d) {
  const candidatos = [];
  const add = (id, n, validos, titulo, observacao, pergunta) => {
    if (n > 1 && validos > 0) candidatos.push({
      id,
      n,
      validos,
      titulo,
      observacao,
      pergunta
    });
  };
  for (const v of d.relacoes ?? []) {
    const r = relacoes[v.codigo];
    if (r) add(`relacao:${v.codigo}`, v.condicao, v.validos, r[2], `${r[0]} e ${r[1].toLowerCase()} foram registrados juntos em ${nCompras(v.condicao)} do período.`, r[3]);
  }
  const dias = d.habitos?.diasSemana ?? [],
    fim = dias.filter(v => v.dia === 0 || v.dia === 6).reduce((n, v) => n + v.compras, 0);
  if (fim / d.universo > 0.5) add('tempo:fim', fim, d.universo, 'Compras no fim de semana', `${nCompras(fim)} foram registradas aos sábados e domingos.`, 'O que pode ter influenciado suas compras no fim de semana?');
  for (const v of d.habitos?.categorias ?? []) add(`categoria:${v.nome}`, v.compras, d.habitos.categoriasValidas, 'Uma categoria em diferentes compras', `${v.nome} apareceu em ${nCompras(v.compras)}.`, 'Essas escolhas atenderam a necessidades recorrentes ou a ocasiões diferentes?');
  for (const v of fatoresPeriodo(d.sinais ?? [])) add(`fator:${v.codigo}`, v.condicao, v.validos, v.nome, v.descricao, v.codigo === 'PROMOCAO' ? 'Que papel as ofertas tiveram no conjunto das escolhas deste período?' : v.codigo === 'IMPULSO' || v.codigo === 'SEM_IMPULSO' ? 'O que você percebe ao comparar suas respostas sobre essas compras?' : 'O que esses registros mostram sobre o planejamento e as necessidades do período?');
  candidatos.sort((a, b) => b.n - a.n || b.n / b.validos - a.n / a.validos || b.validos - a.validos || a.id.localeCompare(b.id));
  const neutro = {
    id: 'objetivo',
    titulo: d.universo > 1 ? 'Registros do período' : 'Poucos dados disponíveis',
    observacao: d.universo ? `${nCompras(d.universo)} ${d.universo === 1 ? 'elegível registrada' : 'elegíveis registradas'}. ${d.universo === 1 ? 'Uma ocorrência não demonstra um hábito.' : 'Os dados ainda não demonstram um padrão recorrente.'}` : 'Nenhuma compra elegível neste período.',
    pergunta: d.universo > 1 ? 'Que necessidades ajudam a entender o conjunto dessas escolhas?' : null
  };
  const destaque = candidatos[0] ?? neutro;
  const reflexao = candidatos.find(v => v.id !== destaque.id) ?? {
    ...neutro,
    observacao: d.universo > 1 ? 'Os registros retratam as escolhas atualmente elegíveis deste período.' : 'Ainda não há base suficiente para refletir sobre hábitos do período.'
  };
  return {
    destaque,
    reflexao,
    relacoes: (d.relacoes ?? []).filter(v => v.condicao > 1 && `relacao:${v.codigo}` !== destaque.id && `relacao:${v.codigo}` !== reflexao.id).map(v => ({
      ...v,
      fatores: relacoes[v.codigo].slice(0, 2)
    }))
  };
}
