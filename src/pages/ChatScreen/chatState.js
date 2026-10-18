export function canComposeChat({
  historicoId,
  isNewConversation = false,
  loadingMessages,
  history,
  composerBlockedByError,
  sending,
}) {
  return Boolean(
    !loadingMessages
      && !composerBlockedByError
      && !sending
      && (isNewConversation || (historicoId && history))
  );
}

/**
 * Resolve explicit navigation state before deriving the effective history id.
 * A new conversation intentionally wins over a stale id that can remain in
 * params when a stack route is reused. Existing conversations are marked
 * explicitly by HistoricalChatScreen, while the id-only form remains
 * compatible with older callers.
 */
export function resolveChatRoute(params = {}) {
  const isNewConversation = params?.mode === 'new';

  return {
    isNewConversation,
    routeHistoricoId: isNewConversation ? null : params?.historicoId ?? null,
  };
}

export function isCurrentChatRequest({
  mounted,
  activeHistoryId,
  conversationId,
  activeRequestId,
  requestId,
}) {
  return Boolean(
    mounted
      && activeHistoryId === conversationId
      && activeRequestId === requestId
  );
}

export function composerBlockedAfterReconciliation(reconciliationError) {
  return Boolean(reconciliationError);
}

function compareChatMessages(left, right) {
  const leftTime = new Date(left.mensagem_data_criacao).getTime();
  const rightTime = new Date(right.mensagem_data_criacao).getTime();
  if (leftTime !== rightTime) return leftTime - rightTime;

  const leftId = String(left.mensagem_id);
  const rightId = String(right.mensagem_id);
  const leftNumericId = Number(leftId);
  const rightNumericId = Number(rightId);
  if (Number.isFinite(leftNumericId) && Number.isFinite(rightNumericId)) {
    return leftNumericId - rightNumericId;
  }

  return leftId.localeCompare(rightId);
}

export function mergeChatMessages(currentMessages, nextMessages) {
  const byId = new Map(currentMessages.map((message) => [String(message.mensagem_id), message]));

  nextMessages.filter(Boolean).forEach((message) => {
    byId.set(String(message.mensagem_id), message);
  });

  return [...byId.values()].sort(compareChatMessages);
}

export function createOptimisticUserMessage({ historicoId, texto, requestId, createdAt = new Date().toISOString() }) {
  return {
    mensagem_id: `local-${historicoId}-${requestId}`,
    historico_id: historicoId,
    remetente: 'user',
    texto,
    mensagem_data_criacao: createdAt,
  };
}

export function reconcileOptimisticMessage(currentMessages, temporaryMessageId, serverMessages) {
  const withoutTemporaryMessage = currentMessages.filter(
    (message) => String(message.mensagem_id) !== String(temporaryMessageId),
  );
  return mergeChatMessages(withoutTemporaryMessage, serverMessages);
}
