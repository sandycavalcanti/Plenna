import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../src/pages/ChatScreen/chatState.js', import.meta.url), 'utf8');
const screenSource = await readFile(new URL('../src/pages/ChatScreen/index.js', import.meta.url), 'utf8');
const context = vm.createContext({});
const module = new vm.SourceTextModule(source, { context });
await module.link(() => { throw new Error('chatState.js should not import modules'); });
await module.evaluate();

const { canComposeChat, composerBlockedAfterReconciliation, isCurrentChatRequest } = module.namespace;

test('reconciliação bem-sucedida mantém erro informativo, mas libera o composer', () => {
  assert.equal(composerBlockedAfterReconciliation(null), false);
  assert.equal(canComposeChat({
    historicoId: 10,
    loadingMessages: false,
    history: { historico_id: 10 },
    errorMessage: 'A IA não conseguiu responder agora.',
    composerBlockedByError: false,
    sending: false,
  }), true);
});

test('histórico inválido, carregamento e reconciliação inconclusiva bloqueiam o composer', () => {
  assert.equal(composerBlockedAfterReconciliation(new Error('GET indisponível')), true);
  assert.equal(canComposeChat({
    historicoId: 10,
    loadingMessages: false,
    history: { historico_id: 10 },
    composerBlockedByError: true,
    sending: false,
  }), false);
  assert.equal(canComposeChat({
    historicoId: 10,
    loadingMessages: true,
    history: null,
    composerBlockedByError: false,
    sending: false,
  }), false);
  assert.equal(canComposeChat({
    historicoId: 10,
    loadingMessages: false,
    history: null,
    composerBlockedByError: false,
    sending: false,
  }), false);
});

test('guards impedem resposta tardia após troca de conversa ou invalidação da requisição', () => {
  const currentRequest = {
    mounted: true,
    activeHistoryId: '10',
    conversationId: '10',
    activeRequestId: 4,
    requestId: 4,
  };

  assert.equal(isCurrentChatRequest(currentRequest), true);
  assert.equal(isCurrentChatRequest({ ...currentRequest, activeHistoryId: '11' }), false);
  assert.equal(isCurrentChatRequest({ ...currentRequest, activeRequestId: 5 }), false);
  assert.equal(isCurrentChatRequest({ ...currentRequest, mounted: false }), false);
});

test('erro impeditivo expõe ação explícita para recarregar o histórico', () => {
  assert.match(screenSource, /accessibilityLabel="Recarregar histórico"/);
  assert.match(screenSource, /onPress=\{loadHistory\}/);
  assert.match(screenSource, /composerBlockedByError \? \(/);
});
