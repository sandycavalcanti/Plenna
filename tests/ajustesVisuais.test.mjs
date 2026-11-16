import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ações do questionário usam a mesma largura estrutural do formulário', async () => {
  const styles = await read('src/pages/QuestionarioScreen/styles.js');
  assert.match(styles, /actionsArea:\s*\{[\s\S]*?width: '95%'/);
  assert.match(styles, /actionsArea:\s*\{[\s\S]*?paddingHorizontal: 0/);
  assert.match(styles, /secondaryAction:\s*\{[\s\S]*?width: '100%'/);
  assert.match(styles, /secondaryAction:\s*\{[\s\S]*?minWidth: 170/);
});

test('ações de criar meta explicitam centralização no estado vazio', async () => {
  const home = await read('src/components/HomeComponents/MetasHome.js');
  const emptyState = await read('src/components/Common/AppEmptyState/styles.js');
  assert.match(home, /createAction:\s*\{[\s\S]*?width: 'auto'[\s\S]*?alignSelf: 'center'/);
  assert.match(emptyState, /action:\s*\{[\s\S]*?alignSelf: 'center'/);
});

test('permissões usam a divisória da linha anterior entre proatividade e memória', async () => {
  const styles = await read('src/components/ProfileComponents/Permissions/styles.js');
  assert.match(styles, /memorySection:\s*\{\s*marginTop: 0, paddingTop: 0 \}/);
  assert.doesNotMatch(styles, /memorySection:[\s\S]*?borderTopWidth/);
});
