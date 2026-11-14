import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Home remove textos financeiros redundantes sem ocultar indisponibilidade', async () => {
  const source = await read('src/components/HomeComponents/CardFinanceiroHome.js');
  assert.match(source, /Dados parciais/);
  assert.match(source, /Utilização indisponível/);
  for (const text of ['Valor conhecido do período', 'Referência mensal disponível', 'Saldo considerando os gastos registrados', 'Sem compras confirmadas registradas neste mês', 'Somente registros disponíveis']) {
    assert.doesNotMatch(source, new RegExp(text));
  }
});

test('estados vazios usam o componente compartilhado e mantêm mensagens compactas', async () => {
  const home = await read('src/pages/HomeScreen/index.js');
  const empty = await read('src/components/Common/AppEmptyState/index.js');
  const dashboard = await read('src/pages/DashboardScreen/index.js');
  const category = await read('src/components/DashboardComponents/Categoria/index.js');
  const payment = await read('src/components/DashboardComponents/FormaPagamento/index.js');
  const impulsivity = await read('src/components/DashboardComponents/Impulsividade/index.js');
  const time = await read('src/components/DashboardComponents/TempoApp/index.js');

  for (const source of [home, dashboard, category, payment, impulsivity, time]) assert.match(source, /AppEmptyState/);
  assert.match(empty, /actionLabel/);
  assert.match(home, /Monitoramento desativado\./);
  assert.match(home, /Nenhum tempo registrado hoje/);
  assert.doesNotMatch(home, /Continue acompanhando seus dados para receber sugest/);
});

test('progresso de metas compartilha o mesmo componente entre Home e detalhes', async () => {
  const home = await read('src/components/HomeComponents/MetasHome.js');
  const shared = await read('src/components/Metas/MetaSummaryCard/index.js');
  const details = await read('src/pages/MetaDetailsScreen/index.js');
  const progress = await read('src/components/Metas/MetaProgressBar/index.js');
  const colors = await read('src/constants/colors.js');

  assert.match(home, /MetaSummaryCard/);
  assert.match(shared, /MetaProgressBar/);
  assert.match(details, /MetaProgressBar/);
  assert.match(progress, /Math\.min\(100, Math\.max\(0, numericValue\)\)/);
  assert.match(colors, /metaProgressTrack/);
  assert.match(colors, /metaProgressFill/);
  assert.doesNotMatch(details, /Uma reserva simbólica para acompanhar seu objetivo/);
});

test('modal de meta usa botões compartilhados e finaliza o valor no blur', async () => {
  const form = await read('src/components/Metas/MetaFormSheet/index.js');
  assert.match(form, /variant="primary"/);
  assert.match(form, /variant="secondary"/);
  assert.match(form, /variant="danger"/);
  assert.match(form, /formatarValorMetaEmEdicao/);
});
