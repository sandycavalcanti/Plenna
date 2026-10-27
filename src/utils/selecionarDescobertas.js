export function selecionarDescobertas(candidates = [], limit = 3) {
  const seen = new Set();
  return candidates
    .filter((c) => {
      if (
        !c ||
        !c.codigo ||
        !c.titulo ||
        !c.mensagem ||
        !c.acao ||
        seen.has(c.codigo)
      )
        return false;
      seen.add(c.codigo);
      return true;
    })
    .sort(
      (a, b) =>
        (a.prioridade ?? 99) - (b.prioridade ?? 99) ||
        a.codigo.localeCompare(b.codigo),
    )
    .slice(0, limit);
}
export function cartoesResumo(dados) {
  const cards = (dados?.descobertas ?? [])
    .filter((d) => d.periodo === dados.periodo && d.evidencias?.length)
    .map((d) => ({
      codigo: d.id,
      titulo: d.titulo,
      mensagem: d.informacao,
      icone: d.tipo === 'DECLARADO' ? 'comment-outline' : 'chart-line',
      acao: 'descobertas',
      prioridade: d.relevancia,
      tipoItem: 'DESTAQUE_SISTEMA',
    }));
  const e = dados?.eventos;
  if (e?.disponivel && e.reembolsadoCentavos > 0)
    cards.push({
      codigo: 'REEMBOLSOS',
      titulo: 'Reembolsos registrados',
      mensagem:
        (e.reembolsadoCentavos / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }) + ' com data neste mês.',
      icone: 'cash-refund',
      acao: 'descobertas',
      prioridade: 2,
      tipoItem: 'DESTAQUE_SISTEMA',
    });
  return cards;
}
