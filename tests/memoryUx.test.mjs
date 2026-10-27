import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createRenderer } from './helpers/componentRenderer.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('tela única de memória usa o gate local antes de consultar dados', async () => {
  const list = await read('src/pages/MemoryListScreen/index.js');
  const routes = await read('src/routes.js');

  assert.match(list, /useProtectedAccess/);
  assert.match(list, /PinModal/);
  assert.match(list, /status === PROTECTED_ACCESS_STATES\.UNLOCKED/);
  assert.match(list, /listarMemorias/);
  assert.match(list, /excluirMemoria/);
  assert.match(list, /Alert\.alert/);
  assert.match(list, /deletingRef/);
  assert.match(list, /current\.filter/);
  assert.match(list, /delete-outline/);
  assert.doesNotMatch(list, /MemoryManagement|Gerenciar memórias/);
  assert.doesNotMatch(list, /criarMemoria|atualizarMemoria/);
  assert.doesNotMatch(routes, /MemoryManagement/);
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

function createMemoryScreenHarness({ status = 'unlocked', deleteBehavior = 'resolve' } = {}) {
  const state = {
    memories: [{ memoria_id: 7, conteudo: 'Prefiro revisar o orçamento aos domingos.', origem: 'DECLARADA' }],
    listCalls: 0,
    deleteCalls: [],
    resolveDelete: null,
  };
  const accessStates = {
    LOCKED: 'locked', CHECKING: 'checking', BIOMETRIC: 'biometric', PIN: 'pin',
    SETUP: 'setup', LOCKOUT: 'lockout', UNLOCKED: 'unlocked', ERROR: 'error',
  };
  const access = {
    status,
    errorMessage: '',
    lifecycleRevision: 0,
    beginAccess() {},
    cancelAccess() {},
    completeSetup() {},
    submitPin() {},
    usePinFallback() {},
  };
  const excluir = async (id) => {
    state.deleteCalls.push(id);
    if (deleteBehavior === 'reject') throw new Error('falha');
    if (deleteBehavior === 'pending') await new Promise(resolve => { state.resolveDelete = resolve; });
  };
  const renderer = createRenderer({
    '@react-navigation/native': { useNavigation: () => ({ goBack() {}, navigate() {} }), useIsFocused: () => true, useFocusEffect() {} },
    '../../hooks/useProtectedAccess': { PROTECTED_ACCESS_STATES: accessStates, useProtectedAccess: () => access },
    '../../api/memoria': {
      listarMemorias: async () => { state.listCalls += 1; return { itens: state.memories }; },
      excluirMemoria: excluir,
    },
  });
  return { state, access, renderer, Screen: renderer.load('src/pages/MemoryListScreen/index.js').default };
}

async function settle(renderer) {
  await renderer.flush();
  await renderer.flush();
}

test('tela lista memórias, confirma cancelamento e exclui somente após sucesso', async () => {
  const harness = createMemoryScreenHarness();
  harness.renderer.mount(harness.Screen);
  await settle(harness.renderer);

  assert.equal(harness.state.listCalls, 1);
  let deleteButton = harness.renderer.nodes(node => node.props.accessibilityLabel === 'Excluir memória 7')[0];
  assert.ok(deleteButton);

  deleteButton.props.onPress();
  assert.equal(harness.renderer.alerts.length, 1);
  assert.deepEqual(harness.state.deleteCalls, []);

  deleteButton.props.onPress();
  const confirm = harness.renderer.alerts[1][2][1];
  await confirm.onPress();
  await settle(harness.renderer);
  assert.deepEqual(harness.state.deleteCalls, [7]);
  assert.equal(harness.renderer.nodes(node => node.props.accessibilityLabel === 'Excluir memória 7').length, 0);
});

test('tela bloqueia a consulta sem PIN validado e mantém item em exclusão pendente ou com erro', async () => {
  const locked = createMemoryScreenHarness({ status: 'setup' });
  locked.renderer.mount(locked.Screen);
  await settle(locked.renderer);
  assert.equal(locked.state.listCalls, 0);
  assert.equal(locked.renderer.nodes(node => node.type === 'Modal')[0].props.visible, true);

  const pending = createMemoryScreenHarness({ deleteBehavior: 'pending' });
  pending.renderer.mount(pending.Screen);
  await settle(pending.renderer);
  const button = pending.renderer.nodes(node => node.props.accessibilityLabel === 'Excluir memória 7')[0];
  button.props.onPress();
  const action = pending.renderer.alerts[0][2][1];
  const request = action.onPress();
  await settle(pending.renderer);
  assert.equal(pending.renderer.nodes(node => node.props.accessibilityLabel === 'Excluir memória 7')[0].props.disabled, true);
  pending.state.resolveDelete();
  await request;
  await settle(pending.renderer);

  const failed = createMemoryScreenHarness({ deleteBehavior: 'reject' });
  failed.renderer.mount(failed.Screen);
  await settle(failed.renderer);
  failed.renderer.nodes(node => node.props.accessibilityLabel === 'Excluir memória 7')[0].props.onPress();
  await failed.renderer.alerts[0][2][1].onPress();
  await settle(failed.renderer);
  assert.equal(failed.renderer.nodes(node => node.props.accessibilityLabel === 'Excluir memória 7').length, 1);
  assert.match(JSON.stringify(failed.renderer.output ?? failed.renderer.nodes(() => true)), /Não foi possível excluir/);
});
