// Compras com itens sem categoria ou com v?rias categorias n?o recebem um rateio inventado.
export function grupoCategoria(c) {
  const items = (c.tb_compra_item || []).filter(
      (i) => i.compra_item_ativo !== 0,
    ),
    ids = [
      ...new Set(
        items.flatMap((i) => (i.categoria_id ? [i.categoria_id] : [])),
      ),
    ];
  if (!items.length || items.some((i) => !i.categoria_id)) return 'SEM';
  return ids.length === 1 ? 'ID:' + ids[0] : 'MULTIPLAS';
}

// Uses the same confirmed/active universe as financeiro.ts; amount is already net.
export function comprasPeriodo(
  rows = [],
  {
    periodo,
    timezone = 'UTC',
    classificacao,
    categoriaId,
    grupoCategoria: grupo,
    pagamento,
  } = {},
  now = new Date(),
) {
  return rows
    .filter((c) => {
      if (c.compra_ativo === 0 || c.compra_status !== 'CONFIRMADA')
        return false;
      const date = new Date(c.compra_horario);
      if (!Number.isFinite(date.getTime()) || date >= now) return false;
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
      }).formatToParts(date);
      const month =
        parts.find((p) => p.type === 'year').value +
        '-' +
        parts.find((p) => p.type === 'month').value;
      if (periodo && month !== periodo) return false;
      if (
        classificacao &&
        (classificacao === 'NAO_IDENTIFICADA'
          ? ['IMPULSIVA', 'NAO_IMPULSIVA', 'PENDENTE'].includes(
              c.compra_classificacao,
            )
          : c.compra_classificacao !== classificacao)
      )
        return false;
      if (
        categoriaId &&
        !c.tb_compra_item?.some(
          (i) => i.compra_item_ativo !== 0 && i.categoria_id === categoriaId,
        )
      )
        return false;
      if (grupo && grupoCategoria(c) !== grupo) return false;
      if (
        pagamento != null &&
        String(c.forma_pagamento_id ?? 'SEM') !== pagamento
      )
        return false;
      return true;
    })
    .sort(
      (a, b) =>
        Date.parse(b.compra_horario) - Date.parse(a.compra_horario) ||
        b.compra_id - a.compra_id,
    );
}
export const moedaCompra = (value) =>
  value == null || value === '' || !Number.isFinite(Number(value))
    ? 'Valor não informado'
    : Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
