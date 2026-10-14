import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChatErrorMessage, getHistory, sendFirstMessage, sendMessage, CHAT_MAX_MESSAGE_CHARS } from '../../api/chat';
import { COLORS } from '../../constants/colors';
import MarkdownMessage from './markdown';
import {
  canComposeChat,
  composerBlockedAfterReconciliation,
  createOptimisticUserMessage,
  isCurrentChatRequest,
  mergeChatMessages,
  reconcileOptimisticMessage,
  resolveChatRoute,
} from './chatState';
import { styles } from './styles';

function formatMessageTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function ChatMessage({ item }) {
  const isUser = item.remetente === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
      <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.assistantMessage]}>
        {isUser ? <Text style={[styles.messageText, styles.userMessageText]}>{item.texto}</Text> : <MarkdownMessage value={item.texto} />}
        <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
          {formatMessageTime(item.mensagem_data_criacao)}
        </Text>
      </View>
    </View>
  );
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let active = true;
    const reduceMotionResult = AccessibilityInfo.isReduceMotionEnabled?.();
    if (reduceMotionResult?.then) {
      reduceMotionResult.then((enabled) => {
        if (active) setReducedMotion(Boolean(enabled));
      });
    }
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReducedMotion);

    return () => {
      active = false;
      subscription?.remove?.();
    };
  }, []);

  return reducedMotion;
}

function TypingDot({ delay, reducedMotion }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.7);
      return undefined;
    }

    const animation = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.35, duration: 350, useNativeDriver: true }),
      Animated.delay(180),
    ]));
    animation.start();

    return () => animation.stop();
  }, [delay, opacity, reducedMotion]);

  return <Animated.View style={[styles.typingDot, { opacity }]} />;
}

function AssistantTypingIndicator() {
  const reducedMotion = useReducedMotion();

  return (
    <View style={styles.typingRow} accessibilityLabel="Plenna está respondendo">
      <View style={[styles.messageBubble, styles.assistantMessage, styles.typingBubble]}>
        <View style={styles.typingDots}>
          <TypingDot delay={0} reducedMotion={reducedMotion} />
          <TypingDot delay={120} reducedMotion={reducedMotion} />
          <TypingDot delay={240} reducedMotion={reducedMotion} />
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen({ navigation }) {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { isNewConversation, routeHistoricoId } = resolveChatRoute(route.params);
  const listRef = useRef(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const sendRequestIdRef = useRef(0);
  const activeHistoryIdRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const shouldScrollAfterLoadRef = useRef(true);

  const [history, setHistory] = useState(null);
  const [createdHistoryId, setCreatedHistoryId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [composerHeight, setComposerHeight] = useState(44);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [composerBlockedByError, setComposerBlockedByError] = useState(false);
  const historicoId = isNewConversation ? createdHistoryId : routeHistoricoId ?? createdHistoryId;
  const historyToLoadId = isNewConversation ? null : routeHistoricoId;
  const conversationKey = historicoId == null ? 'new' : String(historicoId);

  activeHistoryIdRef.current = conversationKey;

  const loadHistory = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    ++sendRequestIdRef.current;

    if (!historyToLoadId) {
      setLoadingMessages(false);
      setAssistantLoading(false);
      setHistory(null);
      setMessages([]);
      setCreatedHistoryId(null);
      setComposerBlockedByError(false);
      setErrorMessage(null);
      return;
    }

    setLoadingMessages(true);
    setSending(false);
    setAssistantLoading(false);
    setErrorMessage(null);
    setComposerBlockedByError(false);
    setHistory(null);
    setMessages([]);
    shouldScrollAfterLoadRef.current = true;

    try {
      const data = await getHistory(historyToLoadId);
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setHistory(data?.historico || null);
      setMessages(Array.isArray(data?.mensagens) ? data.mensagens : []);
      setComposerBlockedByError(false);
      shouldScrollAfterLoadRef.current = true;
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setHistory(null);
      setMessages([]);
      setComposerBlockedByError(true);
      setErrorMessage(getChatErrorMessage(error, 'Não foi possível carregar esta conversa.'));
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) setLoadingMessages(false);
    }
  }, [historyToLoadId]);

  useEffect(() => {
    mountedRef.current = true;
    loadHistory();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      sendRequestIdRef.current += 1;
    };
  }, [loadHistory]);

  const scrollToEndIfNeeded = useCallback(() => {
    if (!listRef.current || (!isNearBottomRef.current && !shouldScrollAfterLoadRef.current)) return;

    requestAnimationFrame(() => {
      if (mountedRef.current) listRef.current?.scrollToEnd({ animated: !shouldScrollAfterLoadRef.current });
    });
    shouldScrollAfterLoadRef.current = false;
  }, []);

  useEffect(() => {
    scrollToEndIfNeeded();
  }, [assistantLoading, messages, scrollToEndIfNeeded]);

  const canCompose = canComposeChat({
    historicoId,
    isNewConversation: historicoId == null,
    loadingMessages,
    history,
    composerBlockedByError,
    sending,
  });

  const handleSend = useCallback(async () => {
    const texto = draftMessage.trim();
    if (!texto || !canCompose) return;

    const conversationId = historicoId == null ? null : String(historicoId);
    const sendRequestId = ++sendRequestIdRef.current;
    const optimisticMessage = createOptimisticUserMessage({
      historicoId: conversationId,
      texto,
      requestId: sendRequestId,
    });
    const isCurrentRequest = () => isCurrentChatRequest({
      mounted: mountedRef.current,
      activeHistoryId: activeHistoryIdRef.current,
      conversationId: conversationId ?? 'new',
      activeRequestId: sendRequestIdRef.current,
      requestId: sendRequestId,
    });

    setSending(true);
    setAssistantLoading(true);
    setErrorMessage(null);
    setComposerBlockedByError(false);
    setDraftMessage('');
    setMessages((currentMessages) => mergeChatMessages(currentMessages, [optimisticMessage]));
    shouldScrollAfterLoadRef.current = true;

    try {
      const result = conversationId == null
        ? await sendFirstMessage(texto)
        : await sendMessage(conversationId, texto);
      if (!isCurrentRequest()) return;

      if (result?.historico?.historico_id) setCreatedHistoryId(result.historico.historico_id);
      if (result?.historico) setHistory(result.historico);
      setMessages((currentMessages) => reconcileOptimisticMessage(
        currentMessages,
        optimisticMessage.mensagem_id,
        [result?.mensagemUsuario, result?.mensagemIA],
      ));
      setAssistantLoading(false);
      shouldScrollAfterLoadRef.current = true;
    } catch (error) {
      if (!isCurrentRequest()) return;
      setAssistantLoading(false);

      // O backend pode ter salvo o user antes de falhar. Reconcile pelo GET;
      // este fluxo nunca repete automaticamente o POST.
      let reconciled = false;
      let reconciliationError = null;
      const responseHistoryId = error?.response?.data?.historico_id;
      const reconciliationId = conversationId ?? (responseHistoryId ? String(responseHistoryId) : null);
      if (responseHistoryId && conversationId == null) setCreatedHistoryId(responseHistoryId);

      try {
        if (!reconciliationId) throw new Error('Historico ainda sem identificador para reconciliacao');
        const data = await getHistory(reconciliationId);
        if (!isCurrentRequest()) return;
        setHistory(data?.historico || null);
        setMessages(Array.isArray(data?.mensagens) ? data.mensagens : []);
        setComposerBlockedByError(false);
        shouldScrollAfterLoadRef.current = true;
        reconciled = true;
      } catch (refetchError) {
        if (!isCurrentRequest()) return;
        reconciliationError = refetchError;
      }

      setComposerBlockedByError(composerBlockedAfterReconciliation(reconciliationError));
      setErrorMessage(reconciliationError
        ? 'Não foi possível confirmar o estado da mensagem nem reconciliar o histórico. Atualize antes de tentar novamente.'
        : reconciled
          ? getChatErrorMessage(error, 'Não foi possível enviar a mensagem. Confira o histórico antes de tentar novamente.')
          : 'Não foi possível confirmar o estado da mensagem. O envio não foi repetido automaticamente; atualize o histórico antes de tentar novamente.');
    } finally {
      if (isCurrentRequest()) setSending(false);
    }
  }, [canCompose, conversationKey, draftMessage, historicoId]);

  const composerCounter = useMemo(() => `${draftMessage.length}/${CHAT_MAX_MESSAGE_CHARS}`, [draftMessage.length]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.keyboardWrapper}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.chatDestinatarioNome} />
          </TouchableOpacity>

          <View style={styles.headerIdentity}>
            <View style={styles.headerAvatar}>
              <MaterialIcons name="chat-bubble-outline" size={21} color={COLORS.chatIconeRobo} />
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                {history?.historico_nome || 'Nova conversa'}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>Plenna Assistente</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardContent}
          behavior="translate-with-padding"
          keyboardVerticalOffset={0}
        >

        {errorMessage && !history && !messages.length ? (
          <View style={styles.stateContainer}>
            <MaterialIcons name="cloud-off" size={34} color={COLORS.chatDestinatarioNome} />
            <Text style={styles.stateTitle}>Não foi possível abrir a conversa</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadHistory} disabled={loadingMessages}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : loadingMessages ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={COLORS.chatBotaoEnviar} />
            <Text style={styles.stateText}>Carregando conversa...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.mensagem_id)}
            renderItem={({ item }) => <ChatMessage item={item} />}
            style={styles.list}
            contentContainerStyle={[styles.messages, !messages.length && styles.emptyMessages]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={({ nativeEvent }) => {
              const distanceFromBottom = nativeEvent.contentSize.height
                - (nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height);
              isNearBottomRef.current = distanceFromBottom < 80;
            }}
            scrollEventThrottle={16}
            onContentSizeChange={scrollToEndIfNeeded}
            ListFooterComponent={assistantLoading ? <AssistantTypingIndicator /> : null}
            ListEmptyComponent={(
              <View style={styles.emptyState}>
                <MaterialIcons name="chat-bubble-outline" size={38} color={COLORS.chatDestinatarioNome} />
                <Text style={styles.stateTitle}>Comece uma nova conversa</Text>
                <Text style={styles.stateText}>Escreva uma mensagem para conversar com a Plenna.</Text>
              </View>
            )}
          />
        )}

        {errorMessage && (history || messages.length > 0) ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="info-outline" size={18} color={COLORS.loginEsqueciSenha} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            {composerBlockedByError ? (
              <TouchableOpacity
                accessibilityLabel="Recarregar histórico"
                accessibilityRole="button"
                style={styles.errorRetryButton}
                onPress={loadHistory}
                disabled={loadingMessages}
              >
                <Text style={styles.errorRetryText}>Recarregar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.composerShell, { paddingBottom: Math.max(5, insets.bottom) }]}>
          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="Mensagem"
              placeholder="Digite uma mensagem..."
              placeholderTextColor={COLORS.chatTextInputTexto}
              style={[styles.chatInput, { height: composerHeight }]}
              value={draftMessage}
              onChangeText={setDraftMessage}
              multiline
              maxLength={CHAT_MAX_MESSAGE_CHARS}
              editable={!sending && canCompose}
              returnKeyType="default"
              blurOnSubmit={false}
              textAlignVertical="top"
              onContentSizeChange={(event) => {
                const nextHeight = Math.min(120, Math.max(44, event.nativeEvent.contentSize.height));
                setComposerHeight(nextHeight);
              }}
            />
            <TouchableOpacity
              accessibilityLabel={sending ? 'Enviando mensagem' : 'Enviar mensagem'}
              accessibilityRole="button"
              style={[styles.sendButton, (!draftMessage.trim() || sending || !canCompose) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!draftMessage.trim() || sending || !canCompose}
              activeOpacity={0.85}
            >
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <MaterialIcons name="send" size={22} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
          <Text style={styles.composerCounter}>{composerCounter}</Text>
        </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
