import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../src/pages/ChatScreen/chatState.js', import.meta.url), 'utf8');
const screenSource = await readFile(new URL('../src/pages/ChatScreen/index.js', import.meta.url), 'utf8');
const chatStylesSource = await readFile(new URL('../src/pages/ChatScreen/styles.js', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../App.js', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const historyScreenSource = await readFile(new URL('../src/pages/HistoricalChatScreen/index.js', import.meta.url), 'utf8');
const historyStylesSource = await readFile(new URL('../src/pages/HistoricalChatScreen/styles.js', import.meta.url), 'utf8');
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

test('históricos exibem exclusão protegida sem confundir abertura com lixeira', () => {
  assert.match(chatApiSource, /apiClient\.delete\(`\/historicos\/\$\{encodeURIComponent\(historicoId\)\}`\)/);
  assert.match(historyScreenSource, /Alert\.alert\(/);
  assert.match(historyScreenSource, /Excluir conversa\?/);
  assert.match(historyScreenSource, /Cancelar/);
  assert.match(historyScreenSource, /style: 'destructive'/);
  assert.match(historyScreenSource, /await deleteHistory\(historyId\)/);
  assert.match(historyScreenSource, /deletingIdsRef/);
  assert.match(historyScreenSource, /removedIdsRef/);
  assert.match(historicalItemSource, /name="delete-outline"/);
  assert.match(historicalItemSource, /onPress=\{onDelete\}/);
  assert.match(historicalItemSource, /onPress=\{onPress\}/);
});

test('histórico usa uma toolbar única para pesquisa e nova conversa', () => {
  assert.doesNotMatch(historyScreenSource, />Conversas</);
  assert.doesNotMatch(historyScreenSource, /Organize suas ideias com a Plenna/);
  assert.match(historyScreenSource, /<View style=\{styles\.toolbar\}>/);
  assert.match(historyScreenSource, /<View style=\{styles\.searchRow\}>/);
  assert.match(historyScreenSource, /style=\{styles\.newButton\}/);
  assert.match(historyScreenSource, /accessibilityLabel="Nova conversa"/);
  assert.match(historyStylesSource, /toolbar:\s*\{[\s\S]*flexDirection: 'row'[\s\S]*alignItems: 'center'/);
  assert.match(historyStylesSource, /searchRow:\s*\{[\s\S]*flex: 1/);
  assert.doesNotMatch(historyStylesSource, /headerTextBlock/);
  assert.doesNotMatch(historyStylesSource, /subtitle/);
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

test('o chat usa um único controlador estrutural para lista e composer', () => {
  assert.match(screenSource, /<SafeAreaView style=\{styles\.container\} edges=\{\['top'\]\}>/);
  assert.match(appSource, /import \{ KeyboardProvider \} from 'react-native-keyboard-controller'/);
  assert.match(appSource, /<KeyboardProvider>[\s\S]*<Routes \/>[\s\S]*<\/KeyboardProvider>/);
  assert.match(screenSource, /import \{ KeyboardAvoidingView \} from 'react-native-keyboard-controller'/);
  assert.match(screenSource, /<KeyboardAvoidingView[\s\S]*style=\{styles\.keyboardContent\}[\s\S]*behavior="translate-with-padding"/);
  assert.match(screenSource, /keyboardVerticalOffset=\{0\}/);
  assert.match(screenSource, /<KeyboardAvoidingView[\s\S]*<FlatList[\s\S]*styles\.composerShell[\s\S]*<\/KeyboardAvoidingView>/);
  assert.match(screenSource, /paddingBottom: Math\.max\(5, insets\.bottom\)/);
  assert.equal(packageJson.dependencies['react-native-keyboard-controller'], '1.20.7');
  assert.equal(packageJson.dependencies['react-native-reanimated'], '4.2.1');
  assert.equal(packageJson.dependencies['react-native-worklets'], '0.7.4');
});

test('lógica manual e painel temporário de teclado foram removidos', () => {
  assert.doesNotMatch(screenSource, /keyboardOverlap|keyboardFrameRef|keyboardVisible/);
  assert.doesNotMatch(screenSource, /measureInWindow|keyboardDidShow|keyboardDidChangeFrame|keyboardDidHide/);
  assert.doesNotMatch(screenSource, /KeyboardDiagnosticPanel|Keyboard screenY:|Manual offset:/);
  assert.doesNotMatch(chatStylesSource, /keyboardDiagnostics|keyboardContentInner/);
  assert.doesNotMatch(screenSource, /KeyboardStickyView/);
});

test('header do chat prioriza o título da conversa e usa avatar acolhedor', () => {
  assert.match(screenSource, /name="chat-bubble-outline"/);
  assert.match(screenSource, /<Text style=\{styles\.headerTitle\} numberOfLines=\{1\} ellipsizeMode="tail">[\s\S]*history\?\.historico_nome \|\| 'Nova conversa'/);
  assert.match(screenSource, /<Text style=\{styles\.headerSubtitle\} numberOfLines=\{1\}>Plenna Assistente<\/Text>/);
  assert.match(screenSource, /setHistory\(result\.historico\)/);
  assert.match(chatStylesSource, /headerTitle:[\s\S]*fontSize: 16[\s\S]*fontWeight: '700'/);
  assert.match(chatStylesSource, /headerSubtitle:[\s\S]*fontSize: 12/);
  assert.match(chatStylesSource, /headerAvatar:[\s\S]*width: 42[\s\S]*height: 42[\s\S]*borderRadius: 21/);
});
