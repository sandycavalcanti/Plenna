import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const money = await import(`data:text/javascript;base64,${Buffer.from(await read('src/utils/goalMoney.js')).toString('base64')}`);

test('normaliza entrada brasileira sem ponto flutuante e respeita o limite da API', () => {
  assert.equal(money.normalizeGoalMoney('150,00').value, '150.00');
  assert.equal(money.normalizeGoalMoney('1.000,50').value, '1000.50');
  assert.equal(money.normalizeGoalMoney('1.234').value, '1234.00');
  assert.equal(money.normalizeGoalMoney('150,999').value, null);
  assert.equal(money.normalizeGoalMoney('0').value, null);
  assert.equal(money.normalizeGoalMoney('100000000,00').value, null);
  assert.equal(money.goalMoneyToCents('0.00'), 0n);
  assert.equal(money.goalMoneyToCents('150.50'), 15050n);
});

test('Home e Perfil abrem detalhes sem usar o toque de navegação para alternar conclusão', async () => {
  const home = await read('src/pages/HomeScreen/index.js');
  const homeComponent = await read('src/components/HomeComponents/MetasHome.js');
  const profileGoals = await read('src/components/ProfileComponents/Goals/index.js');
  const routes = await read('src/routes.js');

  assert.match(home, /navigation\.navigate\('GoalDetails', \{ goalId: goal\.id, goal \}\)/);
  assert.match(homeComponent, /Abrir detalhes da meta/);
  assert.doesNotMatch(homeComponent, /não registra aportes/);
  assert.match(profileGoals, /navigation\.navigate\('GoalDetails', \{ goalId: goal\.meta_id, goal \}\)/);
  assert.match(profileGoals, /accessibilityRole="checkbox"/);
  assert.match(profileGoals, /accessibilityRole="button"/);
  assert.match(routes, /name="GoalDetails"/);
});

test('detalhes usa contratos de histórico, operações existentes e estados de retry', async () => {
  const screen = await read('src/pages/GoalDetailsScreen/index.js');
  const hook = await read('src/hooks/useGoalSavings.js');

  assert.match(screen, /useGoalSavings/);
  assert.match(screen, /loadMovements\(goalId, \{ limit: 20/);
  assert.match(screen, /nextCursor/);
  assert.match(screen, /AsyncStorage\.setItem\(pendingKey\(goalId, pendingScope\), JSON\.stringify\(operation\)\)/);
  assert.match(screen, /AsyncStorage\.removeItem\(pendingKey\(goalId, pendingScope\)\)/);
  assert.match(screen, /tokenStorage\.captureSession\(\)/);
  assert.match(screen, /disabled=\{submitting\}/);
  assert.match(screen, /deposit\(goalId, operation\)/);
  assert.match(screen, /withdraw\(goalId, operation\)/);
  assert.match(screen, /Math\.min\(100, Math\.max\(0, value\)\)/);
  assert.match(hook, /mergeMovements/);
  assert.match(hook, /meta_movimentacao_id/);
});

test('detalhes não introduz compras, dashboards ou ações financeiras fora do cofrinho', async () => {
  const screen = await read('src/pages/GoalDetailsScreen/index.js');
  assert.doesNotMatch(screen, /tb_compra|compras|Dashboard|analisar_metas/);
  assert.match(screen, /checkGoal/);
  assert.match(screen, /Marcar como concluída/);
  assert.match(screen, /Ainda não há movimentações nesta meta/);
});

