import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('telas de memória usam o gate local antes de consultar dados', async () => {
  const list = await read('src/pages/MemoryListScreen/index.js');
  const manage = await read('src/pages/MemoryManagementScreen/index.js');

  for (const source of [list, manage]) {
    assert.match(source, /useProtectedAccess/);
    assert.match(source, /PinModal/);
    assert.match(source, /status === PROTECTED_ACCESS_STATES\.UNLOCKED/);
    assert.match(source, /listarMemorias/);
    assert.match(source, /cancelAccess/);
    assert.doesNotMatch(source, /criarMemoria/);
  }

  assert.match(manage, /excluirMemoria/);
  assert.match(manage, /Alert\.alert/);
  assert.match(manage, /deletingRef/);
  assert.match(manage, /current\.filter/);
});

test('Perfil não oferece mais escrita manual nem lista exposta de memórias', async () => {
  const source = await read('src/components/ProfileComponents/Permissions/index.js');
  assert.match(source, /Consultar minhas memórias/);
  assert.doesNotMatch(source, /criarMemoria|excluirMemoria|listarMemorias|handleCreateMemory|handleDeleteMemory/);
  assert.doesNotMatch(source, /TextInput/);
});

test('PIN não deixa falha de SecureStore virar ReferenceError no setup', async () => {
  const source = await read('src/services/security/pinStorage.js');
  assert.match(source, /catch \(error\) \{\s*throw error;/);
});
