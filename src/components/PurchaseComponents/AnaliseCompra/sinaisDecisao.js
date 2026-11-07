// Presentation over compositor-verified evidence. No score, rule mutation or persistence.
export function interpretarSinais(composto) {
  const principal = composto?.principal;
  const base = {
    id: principal ? `sinais-contextuais-1:${principal.id}` : null,
    versao: 'sinais-contextuais-1'
  };
  if (composto?.estado === 'DESATUALIZADO') return {
    ...base,
    estado: 'DESATUALIZADA',
    titulo: 'Análise desatualizada'
  };
  if (composto?.motivo === 'EVIDENCIAS_CONFLITANTES') return {
    ...base,
    estado: 'CONFLITANTES',
    titulo: 'Evidências conflitantes; revise as respostas registradas'
  };
  if (composto?.estado !== 'VALIDO' || !principal) return {
    ...base,
    estado: 'LIMITADAS',
    titulo: 'Informações limitadas para interpretar os sinais'
  };
  const evidencias = principal.evidencias;
  const valor = campo => evidencias.find(e => e.campo === campo)?.valor;
  const plano = valor('planejamento'),
    promocao = valor('influenciaPromocional'),
    momento = valor('momento'),
    percepcao = valor('autopercepcaoImpulsividade');
  const necessidade = valor('necessidadeInesperada');
  const itemNaoPlanejado = evidencias.some(e => e.campo === 'planejamentoItem' && e.valor === 'NAO');
  // Each combination remains a contextual association, never a classification.
  const combinacao = promocao === 'SIM' && momento === 'ANTECIPADA' || plano === 'NAO' && promocao === 'SIM' && necessidade !== 'SIM' || (plano === 'PARCIALMENTE' || plano === 'SIM') && itemNaoPlanejado || percepcao === 'SIM' && evidencias.some(e => ['planejamento', 'momento', 'influenciaPromocional'].includes(e.campo));
  if (combinacao) return {
    ...base,
    estado: 'OBSERVADOS',
    titulo: 'Sinais contextuais relacionados à impulsividade'
  };
  if (plano === 'SIM' && (percepcao === 'NAO' || promocao === 'NAO') && !itemNaoPlanejado && momento !== 'ANTECIPADA' && percepcao !== 'SIM') return {
    ...base,
    estado: 'NAO_IDENTIFICADOS',
    titulo: 'Nenhum sinal identificado nas evidências avaliadas'
  };
  return {
    ...base,
    estado: 'LIMITADAS',
    titulo: 'Informações limitadas para interpretar os sinais'
  };
}
