export function reflexaoContextual(contexto) {
  if (!contexto) return null;
  const plans =
    contexto.itens?.filter((i) =>
      ['SIM', 'NAO', 'PARCIALMENTE'].includes(i.planejamento),
    ) || [];
  if (
    contexto.respostas.planejamento === 'PARCIALMENTE' &&
    plans.some((i) => i.planejamento === 'NAO')
  )
    return {
      pergunta:
        'O que influenciou a escolha dos itens que não estavam previstos?',
      base: ['Planejamento declarado', 'Planejamento dos itens'],
    };
  if (new Set(plans.map((i) => i.planejamento)).size > 1)
    return {
      pergunta: 'O que foi diferente na decisão de cada item?',
      base: ['Planejamento dos itens'],
    };
  return null;
}
