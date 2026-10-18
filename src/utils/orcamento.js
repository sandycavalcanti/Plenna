/**
 * Regras financeiras das preferências do PLENNA.
 */
export const MAX_VALOR_MONETARIO = 99999999.99;
export const MENSAGEM_VALOR_MONETARIO = 'Use valores de até R$ 99.999.999,99 e no máximo duas casas decimais.';

export function validarValorMonetario(valor) {
  if (!Number.isFinite(valor) || valor < 0 || valor > MAX_VALOR_MONETARIO || Number(valor.toFixed(2)) !== valor) {
    throw Object.assign(new Error(MENSAGEM_VALOR_MONETARIO), { code: 'VALOR_MONETARIO_INVALIDO' });
  }
  return valor;
}

export function calcularOrcamento({
  limiteMensal,
  valorMaximoCompra = 0,
  categorias = [],
  metaBloqueada = false,
  origemAlteracao = 'CATEGORIA',
  idCategoriaOutros = null,
}) {
  const valores = [limiteMensal, valorMaximoCompra];

  valores.forEach(validarValorMonetario);

  if (!Array.isArray(categorias)) {
    throw new Error('Lista de categorias inválida.');
  }

  const ids = new Set();

  const categoriasValidas = categorias.map((categoria) => {
    const id = categoria.categoria_id;
    const limite = Number(categoria.limite);
    validarValorMonetario(limite);

    if (!Number.isInteger(id) || id <= 0 || ids.has(id)) {
      throw new Error('Categoria inválida ou duplicada.');
    }

    ids.add(id);

    return { ...categoria, limite };
  }).filter(
    (categoria) =>
      categoria.limite > 0 &&
      categoria.categoria_id !== idCategoriaOutros
  );

  const somaCategorias = categoriasValidas.reduce(
    (total, categoria) => total + Math.round(categoria.limite * 100),
    0
  ) / 100;
  validarValorMonetario(somaCategorias);

  const minimoNecessario = somaCategorias;

  if (
    origemAlteracao === 'ORCAMENTO_MENSAL' &&
    somaCategorias > limiteMensal
  ) {
    throw new Error(
      'O orçamento mensal é inferior às categorias. Redistribua os valores antes de salvar.'
    );
  }

  if (metaBloqueada && minimoNecessario > limiteMensal) {
    throw new Error(
      'Os limites definidos ultrapassam o teto mensal fixo.'
    );
  }

  const tetoMensal = metaBloqueada
    ? limiteMensal
    : Math.max(limiteMensal, minimoNecessario);

  return {
    tetoMensal,
    somaCategorias,
    sobraParaOutros: Math.max(0, Math.round((tetoMensal - somaCategorias) * 100) / 100),
    categoriasValidas,
  };
}
