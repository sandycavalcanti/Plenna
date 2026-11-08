export function gruposContexto(sinais) {
  return [['PLANEJADA', 'PARCIAL', 'NAO_PLANEJADA'], ['PROMOCAO'], ['ANTECIPADA', 'ADIADA'], ['NECESSIDADE'], ['IMPULSO', 'SEM_IMPULSO']].map(codigos => sinais.filter(s => codigos.includes(s.codigo) && s.validos > 0).sort((a, b) => b.condicao - a.condicao || a.codigo.localeCompare(b.codigo))[0]).filter(Boolean);
}
export function reflexaoPeriodo(d) {
  if (!d.universo) return 'Novos registros elegíveis permitirão observar hábitos do período.';
  if (d.relacoes.some(r => r.condicao > 1)) return 'Alguns fatores apareceram juntos em compras diferentes. O que ajudaria a decidir quais escolhas vale repetir?';
  if (d.habitos.categorias.some(c => c.compras > 1)) return 'Compras na mesma categoria podem atender a necessidades recorrentes. O que orientou essas escolhas no período?';
  if (d.comContexto) return 'As respostas descrevem parte das decisões do período. O que você percebe ao comparar os motivos que registrou?';
  return 'Os registros mostram quando e em quais categorias você comprou. Que necessidades ajudam a entender essa distribuição?';
}
