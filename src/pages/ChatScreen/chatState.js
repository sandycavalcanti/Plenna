export function canComposeChat({
  historicoId,
  loadingMessages,
  history,
  composerBlockedByError,
  sending,
}) {
  return Boolean(
    historicoId
      && !loadingMessages
      && history
      && !composerBlockedByError
      && !sending
  );
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
