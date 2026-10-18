import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const read = (path) => readFileSync(path, 'utf8');
const loadModule = async (path) => import(`data:text/javascript;base64,${Buffer.from(read(path)).toString('base64')}`);
const { calcularOrcamento } = await loadModule('src/utils/orcamento.js');
const { categoriaEhOutros, distribuirSobraEmOutros, obterIdCategoriaOutros, validarCatalogoCategorias } = await loadModule('src/utils/categorias.js');
const catalogo = [
  { categoria_id: 1, categoria_nome: 'Roupas' },
  { categoria_id: 2, categoria_nome: 'Lazer' },
  { categoria_id: 3, categoria_nome: 'Livros' },
  { categoria_id: 14, categoria_nome: 'Outros' },
];

// Executa os handlers reais das telas, sem dependências nativas ou rede.
function criarTela(nome, metaInicial = 500) {
  const codigo = read(`src/pages/${nome}/index.js`);
  const componente = parse(codigo, { sourceType: 'module', plugins: ['jsx'] }).program.body
    .find((node) => node.type === 'ExportDefaultDeclaration').declaration;
  const salvar = nome === 'SignUpScreen' ? 'AtualizarUsuario' : 'salvarPreferencias';
  const nomes = ['obterSomaLimitesCategorias', 'atualizarLimiteMensal', 'ajustarLimiteGastoParaCategorias',
    'selecionarCategoria', 'atualizarLimiteCategoria', 'removerCategoria', salvar];
  if (nome === 'EditPreferencesScreen') nomes.push('carregarDados');
  const funcoes = componente.body.body.filter((node) => node.type === 'FunctionDeclaration' && nomes.includes(node.id.name))
    .map((node) => codigo.slice(node.start, node.end)).join('\n');
  const chamadas = [];
  const erros = [];
  const apiClient = {
    async get(url) {
      if (url === '/users/user') return { data: { usuario_meta_valor_mensal: metaInicial } };
      if (url === '/categories') return { data: catalogo };
      if (url === '/preferencia') return { data: [{ categoria_id: 14, preferencia_meta: metaInicial }] };
      throw new Error(url);
    },
    async put(url, payload) { chamadas.push({ url, payload }); },
  };
  const criar = new Function('apiClient', 'calcularOrcamento', 'categoriaEhOutros', 'distribuirSobraEmOutros',
    'obterIdCategoriaOutros', 'catalogo', 'erros', 'validarCatalogoCategorias', `
    let limiteGastoValor = 290;
    const limiteGastoReferencia = { current: 290 };
    let selectedCategories = [], categories = catalogo;
    let categoriesLoading = false, categoriesError = '', loading = false, loadingError = false;
    const loadingRequest = {current:false};
    const setLoadingError = (value) => { loadingError = value; };
    const registrarFalhaPreferencias = (error) => erros.push(error);
    const mensagemValidacaoPreferencias = () => 'invalid';
    let quantidadeComprasMes = '', valorMaximoCompra = '';
    const valorAtencaoAlterado = { current: false };
    const setValorAtencaoSalvo = () => {};
    const limiteTempo = { current: 0 };
    const setLimiteGastoValor = (v) => { limiteGastoValor = typeof v === 'function' ? v(limiteGastoValor) : v; };
    const setSelectedCategories = (v) => { selectedCategories = typeof v === 'function' ? v(selectedCategories) : v; };
    const setCategories = (v) => { categories = v; };
    const setQuantidadeComprasMes = (v) => { quantidadeComprasMes = v; };
    const setValorMaximoCompra = (v) => { valorMaximoCompra = v; };
    const setStepTwoTouched = () => {}, setStepTwoAttempted = () => {}, setLoading = () => {};
    const fecharTelinhaCategorias = () => {};
    const Alert = { alert: (...args) => { if (args[0] !== 'Sucesso') erros.push(args); } };
    const navigation = { goBack() {}, navigate() {} };
    const logApiErrors = (error) => erros.push(error);
    const stepTwoInvalido = false;
    ${funcoes}
    return { atualizarLimiteMensal, selecionarCategoria, atualizarLimiteCategoria, removerCategoria,
      salvar: ${salvar}, carregar: ${nome === 'EditPreferencesScreen' ? 'carregarDados' : 'async () => {}'},
      estado: () => ({ limite: limiteGastoValor, referencia: limiteGastoReferencia.current, categorias: selectedCategories }) };
  `);
  return { ...criar(apiClient, calcularOrcamento, categoriaEhOutros, distribuirSobraEmOutros, obterIdCategoriaOutros, catalogo, erros, validarCatalogoCategorias), chamadas, erros };
}

for (const nome of ['SignUpScreen', 'EditPreferencesScreen']) {
  async function iniciar(meta = 500) {
    const tela = criarTela(nome, meta);
    if (nome === 'EditPreferencesScreen') await tela.carregar();
    else tela.atualizarLimiteMensal(meta);
    for (const categoria of catalogo.slice(0, 3)) tela.selecionarCategoria(categoria);
    return tela;
  }

  async function verificarPersistencia(tela, limite, outros, bloqueada = false) {
    await tela.salvar(bloqueada);
    assert.deepEqual(tela.erros, []);
    const [usuario, preferencias] = tela.chamadas.slice(-2);
    assert.equal(usuario.url, '/users');
    assert.equal(usuario.payload.metaValorMensal, limite);
    assert.equal(preferencias.url, '/preferencia/bulk');
    const lista = preferencias.payload.preferencias;
    assert.equal(lista.find((c) => c.categoriaId === 14)?.metaMensal ?? 0, outros);
    assert.equal(lista.reduce((total, c) => total + c.metaMensal, 0), limite);
    assert.ok(lista.every((c) => c.metaMensal > 0));
  }

  test(`${nome}: redução após aumento automático retorna à referência e recalcula Outros`, async () => {
    const tela = await iniciar();
    tela.atualizarLimiteCategoria(1, 800);
    assert.equal(tela.estado().limite, 800);
    assert.equal(tela.estado().referencia, 500);
    tela.atualizarLimiteCategoria(1, 200);
    assert.equal(tela.estado().limite, 500);
    await verificarPersistencia(tela, 500, 300);
  });

  test(`${nome}: remoção retorna à referência, inclusive sem categorias específicas`, async () => {
    const tela = await iniciar();
    tela.atualizarLimiteCategoria(1, 800);
    tela.removerCategoria(1);
    assert.equal(tela.estado().limite, 500);
    await verificarPersistencia(tela, 500, 500);
  });

  test(`${nome}: várias reduções mantêm mínimo necessário até caber na referência`, async () => {
    const tela = await iniciar();
    tela.atualizarLimiteCategoria(1, 600);
    tela.atualizarLimiteCategoria(2, 400);
    tela.atualizarLimiteCategoria(3, 200);
    assert.equal(tela.estado().limite, 1200);
    tela.atualizarLimiteCategoria(1, 300);
    assert.equal(tela.estado().limite, 900);
    await verificarPersistencia(tela, 900, 0);
    tela.atualizarLimiteCategoria(2, 100);
    assert.equal(tela.estado().limite, 600);
    tela.atualizarLimiteCategoria(3, 50);
    assert.equal(tela.estado().limite, 500);
    await verificarPersistencia(tela, 500, 50);
  });

  test(`${nome}: remoção acima da referência mantém soma restante`, async () => {
    const tela = await iniciar();
    tela.atualizarLimiteCategoria(1, 600);
    tela.atualizarLimiteCategoria(2, 400);
    tela.removerCategoria(2);
    assert.equal(tela.estado().limite, 600);
    await verificarPersistencia(tela, 600, 0);
  });

  test(`${nome}: alteração manual cria nova referência, inclusive abaixo da soma atual`, async () => {
    const tela = await iniciar();
    tela.atualizarLimiteCategoria(1, 900);
    tela.atualizarLimiteMensal(700);
    assert.equal(tela.estado().referencia, 700);
    assert.equal(tela.estado().limite, 900);
    tela.atualizarLimiteCategoria(1, 100);
    assert.equal(tela.estado().limite, 700);
    tela.atualizarLimiteMensal(1100);
    tela.atualizarLimiteCategoria(1, 1300);
    tela.atualizarLimiteCategoria(1, 200);
    assert.equal(tela.estado().limite, 1100);
    await verificarPersistencia(tela, 1100, 900);
  });

  test(`${nome}: cadeado limita aumento e preserva teto nas reduções e remoções`, async () => {
    const tela = await iniciar();
    tela.atualizarLimiteCategoria(1, 300, true);
    tela.atualizarLimiteCategoria(2, 400, true);
    assert.equal(tela.estado().categorias.find((c) => c.categoria_id === 2).limite, 200);
    tela.atualizarLimiteCategoria(1, 100, true);
    assert.equal(tela.estado().limite, 500);
    tela.removerCategoria(2, true);
    assert.equal(tela.estado().limite, 500);
    await verificarPersistencia(tela, 500, 400, true);
  });

  test(`${nome}: cadeado preserva teto aumentado automaticamente`, async () => {
    const tela = await iniciar();
    tela.atualizarLimiteCategoria(1, 800);
    tela.atualizarLimiteCategoria(1, 200, true);
    assert.equal(tela.estado().limite, 800);
    tela.removerCategoria(1, true);
    await verificarPersistencia(tela, 800, 800, true);
  });
}

test('edição: meta válida da API vira referência inicial, sem substituir por padrão', async () => {
  for (const valor of [125.5, '1750.25']) {
    const tela = criarTela('EditPreferencesScreen', valor);
    await tela.carregar();
    assert.equal(tela.estado().referencia, Number(valor));
    assert.equal(tela.estado().limite, Number(valor));
  }
});

test('formulário transmite cadeado nas alterações manuais e remoções e mostra saldo não negativo', () => {
  const codigo = read('src/components/PreferencesForm/index.js');
  parse(codigo, { sourceType: 'module', plugins: ['jsx'] });
  assert.match(codigo, /onLimiteGastoChange\(numero, metaBloqueada\)/);
  assert.match(codigo, /onRemoverCategoria\(category.categoria_id, metaBloqueada\)/);
  assert.match(codigo, /const valorRestante = Math.max\(0, limiteMensalAtual - valorDistribuido\)/);
});
