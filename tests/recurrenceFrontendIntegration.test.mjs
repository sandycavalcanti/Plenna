import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const createSource = fs.readFileSync(new URL('../src/pages/CreateCompraScreen/index.js', import.meta.url), 'utf8');
const managementSource = fs.readFileSync(new URL('../src/pages/RecurrencesScreen/index.js', import.meta.url), 'utf8');
const routesSource = fs.readFileSync(new URL('../src/routes.js', import.meta.url), 'utf8');
const purchasesSource = fs.readFileSync(new URL('../src/pages/PurchasesScreen/index.js', import.meta.url), 'utf8');

test('mantém o cadastro manual em POST /compras e usa POST /recorrencias no modo recorrente', () => {
  assert.match(createSource, /apiClient\.post\('\/compras', payload\)/);
  assert.match(createSource, /apiClient\.post\('\/recorrencias', \{/);
  assert.match(createSource, /items: payloadItems\.map/);
  assert.match(createSource, /primeiraOcorrencia: formatDateOnly\(firstOccurrenceDate\)/);
  assert.match(createSource, /dataFinal: endDateEnabled && endDate \? formatDateOnly\(endDate\) : null/);
  assert.doesNotMatch(createSource, /usuarioId:/);
});

test('a tela de gestão utiliza todos os endpoints protegidos do CRUD', () => {
  for (const path of [
    "get('/recorrencias')",
    "get(`/recorrencias/${recurrence.id}`)",
    "patch(`/recorrencias/${editor.id}`",
    "post(`/recorrencias/${recurrence.id}/${endpoint}`",
    "get(`/recorrencias/${recurrence.id}/proximas`",
  ]) {
    assert.ok(managementSource.includes(path), `endpoint ausente: ${path}`);
  }
  assert.match(managementSource, /items: payloadItems/);
  assert.match(managementSource, /params: \{ limit: 5 \}/);
  for (const action of ['pausar', 'retomar', 'cancelar']) {
    assert.match(managementSource, new RegExp(`'${action}'`));
  }
});

test('a gestão permanece acessível a partir do fluxo financeiro e mapeia os quatro status', () => {
  assert.match(routesSource, /name="Recurrences"/);
  assert.match(purchasesSource, /navigation\.navigate\('Recurrences'\)/);
  for (const status of ['ATIVA', 'PAUSADA', 'CANCELADA', 'FINALIZADA']) {
    assert.match(managementSource, new RegExp(`${status}:`));
  }
});

test('datas da API são tratadas como datas civis locais', () => {
  assert.match(createSource, /date\.getFullYear\(\).*date\.getMonth\(\).*date\.getDate\(\)/s);
  assert.match(managementSource, /const match = String\(value\)\.match/);
  assert.match(managementSource, /new Date\(Number\(match\[1\]\), Number\(match\[2\]\) - 1, Number\(match\[3\]\), 12\)/);
});

test('falha na previsao nao impede a visualizacao dos detalhes', () => {
  assert.doesNotMatch(managementSource, /Promise\.all\(\[\s*apiClient\.get\(`\/recorrencias\/\$\{recurrence\.id\}`/);
  assert.match(managementSource, /upcomingErrorById/);
  assert.match(managementSource, /Tentar novamente/);
});
