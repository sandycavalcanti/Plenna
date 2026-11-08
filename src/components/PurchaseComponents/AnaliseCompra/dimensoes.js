// Dados da compra visível, independentes da existência de respostas ou avaliação.
// Não consulta histórico nem transforma frequência/valor em classificação.
export function apresentarDadosObjetivos(compra, {
  compraId,
  restricao,
  itensPermitidos
} = {}) {
  if (restricao || !compra || compra.compra_id !== compraId || compra.compra_ativo === 0 || compra.compra_status !== 'CONFIRMADA') return null;
  const itens = Array.isArray(compra.tb_compra_item) ? compra.tb_compra_item.filter(i => i.compra_item_ativo !== 0 && Array.isArray(itensPermitidos) && itensPermitidos.includes(i.compra_item_id)) : [];
  // Um total pode incluir itens protegidos; nesse caso não o reapresentamos.
  const todosVisiveis = Array.isArray(compra.tb_compra_item) && compra.tb_compra_item.filter(i => i.compra_item_ativo !== 0).length === itens.length;
  const raw = compra.compra_valor;
  const valor = typeof raw === 'number' || typeof raw === 'string' && /^\d+(\.\d+)?$/.test(raw) ? Number(raw) : null;
  const centavos = valor === null ? null : Math.round(valor * 100);
  const valorValido = todosVisiveis && Number.isSafeInteger(centavos) && centavos >= 0;
  if (!valorValido && !itens.length) return null;
  return {
    estado: 'DISPONIVEL',
    origem: 'Dados atuais da compra visível',
    observacao: valorValido ? `O valor registrado desta compra é ${valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })}.` : `Esta compra tem ${itens.length} ${itens.length === 1 ? 'item visível registrado' : 'itens visíveis registrados'}.`,
    pergunta: valorValido ? 'Esse valor corresponde ao que você pretendia gastar?' : 'O que orientou a escolha desses itens?'
  };
}
