import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const money = await import(`data:text/javascript;base64,${Buffer.from(await read('src/utils/metaMoney.js')).toString('base64')}`);
const contract = await import(`data:text/javascript;base64,${Buffer.from(await read('src/utils/metaContract.js')).toString('base64')}`);

test('contrato monetário compartilhado trata respostas da API como reais', () => {
  assert.equal(money.formatarValorMeta('500.00'), 'R$ 500,00');
  assert.equal(money.formatarValorMeta('0.00'), 'R$ 0,00');
  assert.equal(money.formatarValorMeta('50000.00'), 'R$ 50.000,00');
  assert.equal(money.formatarPercentualMeta(0), '0%');
  assert.equal(money.formatarPercentualMeta(125), '125%');
  assert.equal(money.normalizarValorMeta('500,00').value, '500.00');
  assert.equal(money.normalizarValorMeta('500.00').value, '500.00');
  assert.equal(money.normalizarValorMeta('50000').value, '50000.00');
  assert.equal(money.prepararPayloadMeta({ titulo: 'Meta', descricao: '', valor: '500,00' }).valor, '500.00');
});

test('GET /metas preserva zero, restante e progresso sem inventar defaults', () => {
  const [meta] = contract.normalizarRespostaMetas([{
    meta_id: 2,
    meta_titulo: 'Cadeira Gamer',
    meta_valor: '500.00',
    meta_valor_reservado: '0.00',
    progresso_percentual: 0,
    valor_restante: '500.00',
    meta_completado: false,
  }]);
  assert.equal(meta.meta_id, 2);
  assert.equal(meta.meta_valor_reservado, '0.00');
  assert.equal(meta.progresso_percentual, 0);
  assert.equal(meta.valor_restante, '500.00');
  assert.throws(() => contract.normalizarRespostaMetas([{
    meta_id: 2,
    meta_titulo: 'Cadeira Gamer',
    meta_valor: '500.00',
    meta_valor_reservado: '0.00',
    progresso_percentual: 0,
    meta_completado: false,
  }]), /INVALID_METAS/);
});

test('payload legado com valor decimal continua em reais e preserva saldo zero', () => {
  const [meta] = contract.normalizarRespostaMetas([{
    meta_id: 2,
    usuario_id: 1,
    meta_titulo: 'Cadeira Gamer',
    meta_descricao: 'Comprar a cadeira Gamer dos sonhos',
    meta_valor: '50000.00',
    meta_data: null,
    meta_completado: false,
    meta_data_criacao: '2026-10-18T16:48:42.051Z',
    meta_valor_reservado: '0.00',
    progresso_percentual: 0,
    valor_restante: '50000.00',
    ultima_movimentacao: null,
    ultimo_deposito: null,
  }]);
  assert.equal(money.formatarValorMeta(meta.meta_valor), 'R$ 50.000,00');
  assert.equal(money.formatarValorMeta(meta.meta_valor_reservado), 'R$ 0,00');
  assert.equal(money.formatarValorMeta(meta.valor_restante), 'R$ 50.000,00');
  assert.equal(money.formatarPercentualMeta(meta.progresso_percentual), '0%');
});

test('INVALID_METAS identifica o campo incompatível sem substituir ausência por zero', () => {
  assert.throws(
    () => contract.normalizarRespostaMetas([{
      meta_id: 2,
      meta_titulo: 'Cadeira Gamer',
      meta_valor: '500.00',
      meta_valor_reservado: '0.00',
      meta_completado: false,
      valor_restante: '500.00',
    }]),
    (error) => error.code === 'INVALID_METAS' && error.details.field === 'progresso_percentual' && error.details.metaId === 2,
  );
});

test('normaliza entrada brasileira sem ponto flutuante e respeita o limite da API', () => {
  assert.equal(money.normalizarValorMeta('150,00').value, '150.00');
  assert.equal(money.normalizarValorMeta('1.000,50').value, '1000.50');
  assert.equal(money.normalizarValorMeta('1.234').value, '1234.00');
  assert.equal(money.normalizarValorMeta('150,999').value, null);
  assert.equal(money.normalizarValorMeta('0').value, null);
  assert.equal(money.normalizarValorMeta('100000000,00').value, null);
  assert.equal(money.valorMetaParaCentavos('0.00'), 0n);
  assert.equal(money.valorMetaParaCentavos('150.50'), 15050n);
});

test('Home e Perfil abrem detalhes sem usar o toque de navegação para alternar conclusão', async () => {
  const home = await read('src/pages/HomeScreen/index.js');
  const homeComponent = await read('src/components/HomeComponents/MetasHome.js');
  const profileMetas = await read('src/components/ProfileComponents/Metas/index.js');
  const routes = await read('src/routes.js');

  assert.match(home, /navigation\.navigate\('MetaDetails', \{ metaId: meta\.id, meta \}\)/);
  assert.match(homeComponent, /Abrir detalhes da meta/);
  assert.doesNotMatch(homeComponent, /não registra aportes/);
  assert.match(profileMetas, /navigation\.navigate\('MetaDetails', \{ metaId: meta\.meta_id, meta \}\)/);
  assert.match(profileMetas, /accessibilityRole="checkbox"/);
  assert.match(profileMetas, /accessibilityRole="button"/);
  assert.match(routes, /name="MetaDetails"/);
});

test('detalhes usa contratos de histórico, operações existentes e estados de retry', async () => {
  const screen = await read('src/pages/MetaDetailsScreen/index.js');
  const hook = await read('src/hooks/useCofrinhoMetas.js');

  assert.match(screen, /useCofrinhoMetas/);
  assert.match(screen, /loadMovements\(metaId, \{ limit: 20/);
  assert.match(screen, /nextCursor/);
  assert.match(screen, /AsyncStorage\.setItem\(pendingKey\(metaId, pendingScope\), JSON\.stringify\(operation\)\)/);
  assert.match(screen, /AsyncStorage\.removeItem\(pendingKey\(metaId, pendingScope\)\)/);
  assert.match(screen, /tokenStorage\.captureSession\(\)/);
  assert.match(screen, /disabled=\{submitting\}/);
  assert.match(screen, /deposit\(metaId, operation\)/);
  assert.match(screen, /withdraw\(metaId, operation\)/);
  assert.match(screen, /Math\.min\(100, Math\.max\(0, value\)\)/);
  assert.match(hook, /mergeMovements/);
  assert.match(hook, /meta_movimentacao_id/);
});

test('detalhes não introduz compras, dashboards ou ações financeiras fora do cofrinho', async () => {
  const screen = await read('src/pages/MetaDetailsScreen/index.js');
  assert.doesNotMatch(screen, /tb_compra|compras|Dashboard|analisar_metas/);
  assert.match(screen, /concluirMeta/);
  assert.match(screen, /Marcar como concluída/);
  assert.match(screen, /Ainda não há movimentações nesta meta/);
});

test('todos os consumidores de metas usam o formatter de reais e mantêm o ID da meta', async () => {
  const home = await read('src/components/HomeComponents/MetasHome.js');
  const profile = await read('src/components/ProfileComponents/Metas/index.js');
  const details = await read('src/pages/MetaDetailsScreen/index.js');
  const api = await read('src/api/metas.js');
  assert.match(home, /formatarValorMeta/);
  assert.match(profile, /formatarValorMeta/);
  assert.match(details, /formatarValorMeta/);
  assert.doesNotMatch(home, /formatarValorMoedaParaTela/);
  assert.doesNotMatch(profile, /formatarValorMoedaParaTela/);
  assert.doesNotMatch(details, /formatarValorMoedaParaTela/);
  assert.match(api, /`\/metas\/\$\{encodeURIComponent\(exigirIdMeta\(metaId\)\)\}\/movimentacoes`/);
  assert.match(details, /deposit\(metaId, operation\)/);
  assert.match(details, /withdraw\(metaId, operation\)/);
});

test('404 de rota é distinguido de META_NAO_ENCONTRADA e a operação pendente permanece recuperável', async () => {
  const hook = await read('src/hooks/useCofrinhoMetas.js');
  const screen = await read('src/pages/MetaDetailsScreen/index.js');
  assert.match(hook, /ROTA_NAO_ENCONTRADA/);
  assert.match(hook, /body\?\.error === 'Route not found'/);
  assert.match(screen, /error\?\.code === 'ROTA_NAO_ENCONTRADA'/);
  assert.match(screen, /AsyncStorage\.setItem\(pendingKey\(metaId, pendingScope\), JSON\.stringify\(operation\)\)/);
  assert.match(screen, /AsyncStorage\.removeItem\(pendingKey\(metaId, pendingScope\)\)/);
});

