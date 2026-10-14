import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChatErrorMessage, getHistory, sendMessage, CHAT_MAX_MESSAGE_CHARS } from '../../api/chat';
import { COLORS } from '../../constants/colors';
import {
  canComposeChat,
  composerBlockedAfterReconciliation,
  isCurrentChatRequest,
} from './chatState';
import { styles } from './styles';

function mergeMessages(currentMessages, nextMessages) {
  const byId = new Map(currentMessages.map((message) => [String(message.mensagem_id), message]));

  nextMessages.filter(Boolean).forEach((message) => {
    byId.set(String(message.mensagem_id), message);
  });

  return [...byId.values()].sort((left, right) => {
    const leftTime = new Date(left.mensagem_data_criacao).getTime();
    const rightTime = new Date(right.mensagem_data_criacao).getTime();
    return leftTime - rightTime || left.mensagem_id - right.mensagem_id;
  });
}

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
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.texto}</Text>
        <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
          {formatMessageTime(item.mensagem_data_criacao)}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen({ navigation }) {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const historicoId = route.params?.historicoId;
  const listRef = useRef(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const sendRequestIdRef = useRef(0);
  const activeHistoryIdRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const shouldScrollAfterLoadRef = useRef(true);

  activeHistoryIdRef.current = historicoId == null ? null : String(historicoId);

  const [history, setHistory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [composerHeight, setComposerHeight] = useState(44);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [composerBlockedByError, setComposerBlockedByError] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!historicoId) {
      setLoadingMessages(false);
      setHistory(null);
      setMessages([]);
      setComposerBlockedByError(true);
      setErrorMessage('Não foi possível identificar esta conversa.');
      return;
    }

    const requestId = ++requestIdRef.current;
    ++sendRequestIdRef.current;
    setLoadingMessages(true);
    setSending(false);
    setErrorMessage(null);
    setComposerBlockedByError(false);
    setHistory(null);
    setMessages([]);
    shouldScrollAfterLoadRef.current = true;

    try {
      const data = await getHistory(historicoId);
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
  }, [historicoId]);

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
  }, [messages, scrollToEndIfNeeded]);

  const canCompose = canComposeChat({
    historicoId,
    loadingMessages,
    history,
    composerBlockedByError,
    sending,
  });

  const handleSend = useCallback(async () => {
    const texto = draftMessage.trim();
    if (!texto || !canCompose) return;

    const conversationId = String(historicoId);
    const sendRequestId = ++sendRequestIdRef.current;
    const isCurrentRequest = () => isCurrentChatRequest({
      mounted: mountedRef.current,
      activeHistoryId: activeHistoryIdRef.current,
      conversationId,
      activeRequestId: sendRequestIdRef.current,
      requestId: sendRequestId,
    });

    setSending(true);
    setErrorMessage(null);
    setComposerBlockedByError(false);
    setDraftMessage('');

    try {
      const result = await sendMessage(conversationId, texto);
      if (!isCurrentRequest()) return;

      setMessages((currentMessages) => mergeMessages(currentMessages, [result?.mensagemUsuario, result?.mensagemIA]));
      shouldScrollAfterLoadRef.current = true;
    } catch (error) {
      if (!isCurrentRequest()) return;

      // O backend pode ter salvo o user antes de falhar. Reconcile pelo GET;
      // este fluxo nunca repete automaticamente o POST.
      let reconciled = false;
      let reconciliationError = null;
      try {
        const data = await getHistory(conversationId);
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
  }, [canCompose, draftMessage, historicoId]);

  const composerCounter = useMemo(() => `${draftMessage.length}/${CHAT_MAX_MESSAGE_CHARS}`, [draftMessage.length]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
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
              <MaterialIcons name="smart-toy" size={19} color={COLORS.chatIconeRobo} />
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Plenna Assistente</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {history?.historico_nome || 'Conversa'}
              </Text>
            </View>
          </View>
        </View>

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

        <View style={styles.composerShell}>
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
    </SafeAreaView>
  );
}
