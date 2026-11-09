import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Compras usa AppFeedback nas ações operacionais e preserva o pull-to-refresh', async () => {
  const source = await read('src/pages/PurchasesScreen/index.js');
  assert.match(source, /components\/Common\/AppFeedback/);
  assert.match(source, /operationFeedback/);
  assert.match(source, /testID="purchases-feedback"/);
  assert.match(source, /RefreshControl/);
  assert.doesNotMatch(source, /Alert\.alert/);
});

test('Recorrências padroniza sucessos e falhas, mas mantém confirmações e validações nativas', async () => {
  const source = await read('src/pages/RecurrencesScreen/index.js');
  assert.match(source, /components\/Common\/AppFeedback/);
  assert.match(source, /testID="recurrences-feedback"/);
  assert.match(source, /setOperationFeedback\(\{ type: 'success'/);
  assert.match(source, /setOperationFeedback\(\{ type: 'error'/);
  assert.match(source, /function confirmCancel/);
  assert.match(source, /Alert\.alert/);
  assert.doesNotMatch(source, /response\?\.data\?\.message/);
});

test('Chat reaproveita AppFeedback com ação explícita de recarregar', async () => {
  const source = await read('src/pages/ChatScreen/index.js');
  assert.match(source, /components\/Common\/AppFeedback/);
  assert.match(source, /actionLabel=\{composerBlockedByError \? 'Recarregar histórico' : undefined\}/);
  assert.match(source, /onAction=\{composerBlockedByError \? loadHistory : undefined\}/);
});

test('Perfil e Preferências apresentam falhas operacionais sem remover seus diálogos de sucesso', async () => {
  const profile = await read('src/pages/EditProfileScreen/index.js');
  const preferences = await read('src/pages/EditPreferencesScreen/index.js');
  for (const source of [profile, preferences]) {
    assert.match(source, /components\/Common\/AppFeedback/);
    assert.match(source, /onDismiss=\{\(\) => set(?:Feedback|feedback)\(null\)\}/);
  }
  assert.match(profile, /Alert\.alert\('Sucesso'/);
  assert.match(preferences, /Alert\.alert\('Sucesso'/);
});
