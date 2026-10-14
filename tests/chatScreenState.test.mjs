import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../src/pages/ChatScreen/chatState.js', import.meta.url), 'utf8');
const screenSource = await readFile(new URL('../src/pages/ChatScreen/index.js', import.meta.url), 'utf8');
const historyScreenSource = await readFile(new URL('../src/pages/HistoricalChatScreen/index.js', import.meta.url), 'utf8');
const historicalItemSource = await readFile(new URL('../src/components/ChatComponents/historicalChatItem/index.js', import.meta.url), 'utf8');
const chatApiSource = await readFile(new URL('../src/api/chat.js', import.meta.url), 'utf8');
const markdownSource = await readFile(new URL('../src/pages/ChatScreen/markdownParser.js', import.meta.url), 'utf8');
const markdownComponentSource = await readFile(new URL('../src/pages/ChatScreen/markdown.js', import.meta.url), 'utf8');
const context = vm.createContext({});
const module = new vm.SourceTextModule(source, { context });
await module.link(() => { throw new Error('chatState.js should not import modules'); });
await module.evaluate();
const markdownModule = new vm.SourceTextModule(markdownSource, { context: vm.createContext({}) });
await markdownModule.link(() => { throw new Error('markdownParser.js should not import modules'); });
await markdownModule.evaluate();

const {
  canComposeChat,
  composerBlockedAfterReconciliation,
  createOptimisticUserMessage,
  isCurrentChatRequest,
  mergeChatMessages,
  reconcileOptimisticMessage,
  resolveChatRoute,
} = module.namespace;
const { parseMarkdownBlocks, parseMarkdownInline } = markdownModule.namespace;

function assertReactNativeJsxImports(source, fileName) {
  const importedNames = new Set(
    (source.match(/import\s*\{([\s\S]*?)\}\s*from\s*['"]react-native['"]/m)?.[1] || '')
      .split(',')
      .map((name) => name.trim().split(/\s+as\s+/)[0])
      .filter(Boolean),
  );
  const nativeNames = new Set([
    'ActivityIndicator',
    'Animated',
    'FlatList',
    'KeyboardAvoidingView',
    'Text',
    'TextInput',
    'TouchableOpacity',
    'View',
  ]);
  const jsxNames = new Set(
    Array.from(source.matchAll(/<([A-Z][A-Za-z0-9]*)\b|<([A-Z][A-Za-z0-9]*)\./g), (match) => match[1] || match[2])
      .filter((name) => nativeNames.has(name)),
  );

  for (const name of jsxNames) {
    assert.equal(importedNames.has(name), true, `${fileName} usa <${name}> sem importar ${name} de react-native`);
  }
}

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

test('nova conversa sem historicoId permite digitar sem simular ID persistido', () => {
  assert.equal(canComposeChat({
    historicoId: null,
    isNewConversation: true,
    loadingMessages: false,
    history: null,
    composerBlockedByError: false,
    sending: false,
  }), true);
  assert.doesNotMatch(historyScreenSource, /createHistory\(/);
  assert.match(historyScreenSource, /navigation\.navigate\('Chat', \{ mode: 'new' \}\)/);
  assert.match(chatApiSource, /apiClient\.post\('\/historicos\/mensagens'/);
});

test('navegacao explicita separa conversa nova de historico existente', () => {
  const newRoute = resolveChatRoute({ mode: 'new', historicoId: 71 });
  assert.equal(newRoute.isNewConversation, true);
  assert.equal(newRoute.routeHistoricoId, null);

  const existingRoute = resolveChatRoute({ mode: 'existing', historicoId: 71 });
  assert.equal(existingRoute.isNewConversation, false);
  assert.equal(existingRoute.routeHistoricoId, 71);

  const legacyExistingRoute = resolveChatRoute({ historicoId: 71 });
  assert.equal(legacyExistingRoute.isNewConversation, false);
  assert.equal(legacyExistingRoute.routeHistoricoId, 71);
  assert.match(historyScreenSource, /mode: 'existing'/);
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

test('mensagem otimista é criada e reconciliada pelo ID persistido sem duplicação', () => {
  const optimistic = createOptimisticUserMessage({
    historicoId: '10',
    texto: 'Mensagem local',
    requestId: 7,
    createdAt: '2026-10-13T10:00:00.000Z',
  });
  const assistant = {
    mensagem_id: 43,
    historico_id: 10,
    remetente: 'assistant',
    texto: 'Resposta persistida',
    mensagem_data_criacao: '2026-10-13T10:00:01.000Z',
  };
  const persistedUser = {
    ...optimistic,
    mensagem_id: 42,
    historico_id: 10,
  };

  assert.equal(optimistic.mensagem_id, 'local-10-7');
  assert.equal(optimistic.remetente, 'user');
  const merged = reconcileOptimisticMessage([optimistic], optimistic.mensagem_id, [persistedUser, assistant]);
  assert.deepEqual(Array.from(merged, (message) => message.mensagem_id), [42, 43]);
  assert.equal(merged.some((message) => String(message.mensagem_id).startsWith('local-')), false);
  assert.deepEqual(Array.from(mergeChatMessages(merged, [persistedUser]), (message) => message.mensagem_id), [42, 43]);
});

test('a UI mantém os três pontos durante o POST e os remove nos finais do fluxo', () => {
  assert.match(screenSource, /setAssistantLoading\(true\)/);
  assert.match(screenSource, /setAssistantLoading\(false\)/);
  assert.match(screenSource, /ListFooterComponent=\{assistantLoading \? <AssistantTypingIndicator \/> : null\}/);
  assert.match(screenSource, /accessibilityLabel="Plenna está respondendo"/);
  assert.match(screenSource, /<TypingDot delay=\{240\}/);
  assert.doesNotMatch(screenSource, /Plenna está digitando/);
});

test('o indicador nao chama Animated.Value como funcao e tolera API de movimento ausente', () => {
  assert.match(screenSource, /new Animated\.Value\(0\.35\)/);
  assert.doesNotMatch(screenSource, /(?<!new )Animated\.Value\(0\.35\)/);
  assert.match(screenSource, /const reduceMotionResult = AccessibilityInfo\.isReduceMotionEnabled\?\.\(\);/);
  assert.match(screenSource, /if \(reduceMotionResult\?\.then\)/);
});

test('componentes React Native usados em JSX possuem imports correspondentes', () => {
  assertReactNativeJsxImports(screenSource, 'ChatScreen');
  assertReactNativeJsxImports(markdownComponentSource, 'MarkdownMessage');
  assertReactNativeJsxImports(historicalItemSource, 'historicalChatItem');
});

test('parser local renderiza markdown sem alterar texto persistido', () => {
  const inline = parseMarkdownInline('**forte** e *ênfase* com `código` [site](https://example.com)');
  assert.deepEqual(Array.from(inline, (segment) => segment.type), ['bold', 'text', 'italic', 'text', 'code', 'text', 'link']);
  const blocks = parseMarkdownBlocks('# Título\n\n- um item\n1. outro item');
  assert.deepEqual(Array.from(blocks, (block) => block.type), ['heading', 'listItem', 'listItem']);
  assert.equal(blocks[2].ordered, true);
});

test('o composer não soma bottom inset externo ao teclado', () => {
  assert.match(screenSource, /<SafeAreaView style=\{styles\.container\} edges=\{\['top'\]\}>/);
  assert.match(screenSource, /keyboardVerticalOffset=\{0\}/);
  assert.match(screenSource, /behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/);
  assert.match(screenSource, /paddingBottom: Platform\.OS === 'ios' \? Math\.max\(5, insets\.bottom\) : 5/);
});
