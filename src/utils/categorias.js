export function obterIdCategoriaOutros(catalogo) {
  const normalizar = (nome) => String(nome ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
  const matches = catalogo.filter((categoria) => normalizar(categoria.categoria_nome) === 'outros');
  if (matches.length !== 1) throw new Error(matches.length === 0
    ? 'Categoria Outros ausente no catálogo. Não foi possível distribuir a sobra do orçamento.'
    : 'Categoria Outros duplicada no catálogo. Não foi possível distribuir a sobra do orçamento.');
  const id = matches[0].categoria_id;
  if (!Number.isInteger(id) || id <= 0) throw new Error('Categoria Outros com identificador inválido no catálogo.');
  return id;
}

export function distribuirSobraEmOutros(selecionadas, catalogo, sobra) {
  if (!Array.isArray(selecionadas) || !Array.isArray(catalogo)) {
    throw new Error('Lista de categorias inválida.');
  }

  if (!Number.isFinite(sobra) || sobra < 0) {
    throw new Error('Saldo do orçamento inválido.');
  }

  if (sobra === 0 && selecionadas.length === 0) {
    return [];
  }

  const idOutros = obterIdCategoriaOutros(catalogo);

  const categorias = selecionadas
    .filter((categoria) => categoria.categoria_id !== idOutros)
    .map((categoria) => ({ ...categoria }));

  if (sobra > 0) {
    const outros = catalogo.find(
      (categoria) => categoria.categoria_id === idOutros
    );

    categorias.push({
      categoria_id: idOutros,
      categoria_nome: outros.categoria_nome,
      limite: sobra,
    });
  }

  return categorias;
}

export function validarCatalogoCategorias(catalogo, selecionadas = []) {
  const invalidar = () => {
    throw Object.assign(new Error('Catálogo de categorias inválido. Tente carregar novamente.'), { code: 'CATALOGO_INVALIDO' });
  };
  if (!Array.isArray(catalogo) || !Array.isArray(selecionadas)) invalidar();
  const ids = new Set();
  const nomes = new Set();
  for (const categoria of catalogo) {
    const id = categoria?.categoria_id;
    const nome = String(categoria?.categoria_nome ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    if (!Number.isInteger(id) || id <= 0 || !nome || ids.has(id) || nomes.has(nome)) invalidar();
    ids.add(id);
    nomes.add(nome);
  }
  if (!nomes.has('outros') || selecionadas.some((categoria) => !ids.has(categoria?.categoria_id))) invalidar();
  return catalogo;
}

export function categoriaEhOutros(categoria) {
  const nome = String(categoria?.categoria_nome ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');

  return nome === 'outros';
}
